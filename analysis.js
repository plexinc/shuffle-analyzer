#!/usr/bin/env node --harmony
const axios = require('axios');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const moment = require('moment');

const sections = [
  {
    header: 'Plex Shuffle Analyzer',
    content: 'Analyzes a library shuffle.'
  },
  {
    header: 'Options',
    optionList: [
      { name: 'server', alias: 's', type: String, description: 'Base URL of the server (default: http://127.0.0.1:32400).', typeLabel: '{underline server url}', defaultValue: 'http://127.0.0.1:32400'},
      { name: 'token', alias: 't', type: String, description: 'Plex token to use with server.', typeLabel: '{underline token}' },
      { name: 'runs', alias: 'r', type: String, description: 'How many runs to analyze.', typeLabel: '{underline runs}', defaultValue: 10 },
      { name: 'library', alias: 'l', type: String, description: 'ID of the target library.', typeLabel: '{underline library ID}'},
      { name: 'mode', alias: 'm', type: String, description: 'Specifc thing to analyze, either radio or shuffle', typeLabel: '{underline thing to analyze}', defaultValue: 'radio'},
      { name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.' }
    ]
  }
];

// Check arguments.
const args = commandLineArgs(sections[1].optionList);
const hasArgs = !!args.token && !!args.library;

if (Object.keys(args).length === 0 || args.help || !hasArgs) {
  console.log(commandLineUsage(sections));
  process.exit(0);
}

// Set token header.
axios.defaults.headers.common['X-Plex-Token'] = args.token;
axios.defaults.headers.common['Accept'] = 'application/json';

run(args).then().catch(e => {
  console.log(e);
});

async function run(args) {
  // Go get the library.
  if (!await checkLibrary()) {
    console.log('The library section was inaccessible or did not exist.');
    return;
  }

  // Get the server.
  const identifier = await getServer();

  const titles = {};
  const lastPlayed = {};
  const trackCounts = {};
  const albumCounts = {};
  const artistCounts = {};

  // Make play queues.
  console.log(`Creating ${args.runs} play queues and looking at 50 first tracks for mode ${args.mode}...`);
  for (let i = 0; i < args.runs; i++) {
    const data = await makePlayQueue(identifier);
    data.forEach(metadata => {
      lastPlayed[metadata.ratingKey] = metadata.lastViewedAt;
      titles[metadata.ratingKey] = `${metadata.grandparentTitle} - ${metadata.title}`;
      titles[metadata.parentRatingKey] = `${metadata.grandparentTitle} - ${metadata.parentTitle}`;
      titles[metadata.grandparentRatingKey] = metadata.grandparentTitle;

      trackCounts[metadata.ratingKey] = (trackCounts[metadata.ratingKey] || 0) + 1;
      albumCounts[metadata.parentRatingKey] = (albumCounts[metadata.parentRatingKey] || 0) + 1;
      artistCounts[metadata.grandparentRatingKey] = (artistCounts[metadata.grandparentRatingKey] || 0) + 1;
    });
  }

  printResults('Artists', titles, artistCounts);
  printResults('Albums', titles, albumCounts);
  printResults('Tracks', titles, trackCounts, lastPlayed);
}

function printResults(title, titles, counts, lastPlayed) {
  console.log(`${title}:`);
  const sortedArtists = Object.entries(counts).sort((p1, p2) => p2[1] - p1[1]).slice(0, 10);
  sortedArtists.map(pair => {
    let time = '';
    if (lastPlayed) {
      time = `  (${moment.unix(lastPlayed[pair[0]]).fromNow()})`;
    }
    console.log(`  ${pair[1]} - ${titles[pair[0]]}${time}`);
  });
}

async function makePlayQueue(identifier) {
  // Build the play queue.
  const key = args.mode === 'radio' ? `/library/sections/${args.library}/stations/1` : `/library/sections/${args.library}/all`;
  const uri = `server%3A%2F%2F${identifier}%2Fcom.plexapp.plugins.library${encodeURIComponent(key)}`;
  const resp = await axios.post(`${args.server}/playQueues?uri=${uri}&type=audio&shuffle=1&X-Plex-Client-Identifier=111`);
  const playQueueID = resp.data.MediaContainer.playQueueID;
  
  // Ask for a bigger window.
  const pq = await axios.get(`${args.server}/playQueues/${playQueueID}?window=100`);
  return pq.data.MediaContainer.Metadata;
}

async function getServer() {
  const resp = await axios.get(`${args.server}`);
  return resp.data.MediaContainer.machineIdentifier;
}

async function checkLibrary() {
  // Get library sections.
  const resp = await axios.get(`${args.server}/library/sections`);
  const section = resp.data.MediaContainer.Directory.find(dir => dir.key === args.library);
  if (section) {
    console.log('Found library section.');
    return true;
  }

  return false;
}

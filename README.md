### Introduction

Use this to analyze shuffles from your Plex Media Server. You'll need to figure out:

- A token (xxx below).
- The ID of the music library (1224 below).

### Example

Library radio, look at 20 different plays, look at first 10 tracks and print top occurances of tracks:

```
$ ❯ ./analysis.js -t xxx -l 1224 -r 20 -m radio -c 10

Found library section.
Creating 20 play queues and looking at 10 first tracks for mode radio...
Tracks:
  2 - John Cunningham - Imitation Time  (6 months ago)
  2 - The Maldives - Blood Relations  (2 months ago)
  2 - Clue to Kalo - The Just Is Enough  (a year ago)
  2 - Vince Guaraldi Trio - Skating  (5 months ago)
  2 - Game Theory - Regenisraen  (4 years ago)
  2 - Simon & Garfunkel - The Only Living Boy in New York  (16 days ago)
  2 - Don McLean - American Pie  (a month ago)
  2 - Robyn Hitchcock and the Egyptians - My Wife and My Dead Wife  (a year ago)
  2 - The Kinks - You Really Got Me  (2 months ago)
  2 - One Left - The Demon Haunted World  (2 months ago)
```

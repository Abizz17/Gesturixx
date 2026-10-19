# ✊✋✌️ Gesturixx

Play **Stone Paper Scissors** against the computer using only your hand. No mouse, no keyboard, just your webcam.

Built with plain **HTML, CSS and JavaScript** and **MediaPipe Hands** for real-time hand tracking.

## How to play

1. Click **Start camera and play** and allow camera access.
2. Wait for the 3-2-1 countdown.
3. When it says **Show!**, make your gesture:

| Gesture | Move |
|---|---|
| ✊ Fist | Stone |
| ✋ Open hand | Paper |
| ✌️ Two fingers | Scissors |

4. The computer picks randomly, and the winner is shown with the running score.

## Features

- Live hand tracking with a glowing neon skeleton over your hand
- Live label showing which gesture the game detects
- Gesture locked from the last 0.5 seconds, so small flickers don't change your move
- Works with tilted hands
- Mobile responsive, uses the front camera on phones
- Manual buttons if there is no camera

## How it works

MediaPipe Hands gives 21 landmarks for your hand. A finger counts as "up" when its tip is farther from the wrist than its middle joint.

- No fingers up → **Stone**
- Index and middle up, ring and pinky down → **Scissors**
- Three or more fingers up → **Paper**

## Tech stack

HTML · CSS · JavaScript · MediaPipe Hands

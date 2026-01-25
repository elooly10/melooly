# Melooly
NPM package for using [Meloolies](https://me.elooly.com) in Node.js projects.

## Installation
```bash
npm i melooly
```

You will need to sign up [online](https://me.elooly.com) to get an API key and website ID. 

## Documentation
See [https://me.elooly.com/docs](https://me.elooly.com/docs) for developer documentation.

### Sample program
```ts
// Get Meloolies from a user and draw the primary Melooly to a canvas
const launcher = new MeloolyLauncher();
uid = await launcher.initiatePopup(); // Get User ID with popup
if (!uid) return;
const meloolies = await launcher.getMelooly(uid).catch((err) => console.error(err)); // Fetch user's meloolies.
if (!meloolies) return;

// Prepare Canvas
const canvas = document.createElement('canvas');
canvas.width = 270;
canvas.height = 270;
const ctx = canvas.getContext('2d');
if (!ctx) return;

// Draw primary Melooly onto canvas
await meloolies[0].saveSelectedComponents(); // Save current Melooly's components
meloolies[0].draw(ctx); // Melooly drawn!
```

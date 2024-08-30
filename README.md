# PxlAI - The broken browser pixel editor no one wanted built with AI

Over the course of a week on Twitch I decided to try and develop a fully featured pixel art editor using nothing but LLM promps.

There were some definite ups and downs during this process you can watch all the vods over at [twitch.tv/trey_bastian](https://twitch.tv/trey_bastian)

**This thing is broken, we tried to fix some canvas issues on Thursday and really got it into a broken state that has been challenging and frustrating trying to recover from**

### What have we had working at various points in time during this?
- A fully floating positional UI layout
- The ability to load and save files with versioning and graceful fallback to load old versioned files
- layers with visibility toggleing and re-rodering
- a canvas to draw on with a virtual canvas to manage layer drawing
- editable and re-orderable color palette with the ability to save or load Gimp or Photoshop palette files
- HSLA, RGBA, CMYKA color sliders that you can seamlessly switch between a use
- Export to PNG

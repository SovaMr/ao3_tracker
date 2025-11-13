# AO3 Tracker App

A script that automatically tracks your daily hits and kudos and appends them to your G-Sheet


The AO3 Tracker is a simple JavaScript code that will automatically fetch information about the selected stories.

Based on the story URL, it fetches the publicly available information.

# No credentials needed!

Just edit the URLs, names of your stories, and paste it into the Google AppScript for your Google Sheet.

const WORKS = [
  { name: "Name", url: "https://archiveofourown.org/works/xxxxxxxx" }
];

You can schedule the script to run daily, so it will calculate the deltas.

# What is delta? 
It is a difference in hits between today and yesterday.

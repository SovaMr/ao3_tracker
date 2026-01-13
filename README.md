# AO3 Tracker App

A script that automatically tracks your daily hits and kudos and appends them to your G-Sheet


The AO3 Tracker is a simple JavaScript code that will automatically fetch information about the selected stories.

Based on the story URL, it fetches ONLY the publicly available information.

# No credentials needed!

Just edit the URLs, names of your stories, and paste them into the Google AppScript for your Google Sheet.

const WORKS = [
  { name: "Name", url: "https://archiveofourown.org/works/xxxxxxxx" }
];

You can schedule the script to run daily to calculate the deltas.

# What is delta? 
Delta is the difference in hits between today and yesterday.

# Shape of the G-Sheet
For this code, the document collects data in G-Sheet, starting from row 3. See code line 33.

|        |       Hits        |    Delta Hits     |    Delta Kudos    |       Kudos       |
| ------ | ----------------- | ----------------- | ----------------- | ----------------- |
|  Date  | Story 1 | Story 2 | Story 1 | Story 2 | Story 1 | Story 2 | Story 1 | Story 2 | 
| 13-Nov | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |


# Need more info?
If you want to add information about bookmarks or comments, just add the following to the function fetchAO3Stats():

const bookmarksMatch = clean.match(/<dt[^>]*>\s*Bookmarks:\s*<\/dt>\s*<dd[^>]*>([\d,]+)/i);
const commentsMatch  = clean.match(/<dt[^>]*>\s*Comments:\s*<\/dt>\s*<dd[^>]*>([\d,]+)/i);

Remember to update your return(), too:

return { hits, kudos, bookmarks, comments };

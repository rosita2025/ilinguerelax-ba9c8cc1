import { extractDriveId, normalizeDriveUrl } from "./manage-products/index.ts";

const testUrls = [
  "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7/view?usp=sharing",
  "https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7",
  "https://docs.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7/edit",
  "https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7?usp=sharing",
  "https://drive.google.com/folderview?id=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7",
  "invalid-url"
];

console.log("Testing Backend Drive Normalization:");
testUrls.forEach(url => {
  const norm = normalizeDriveUrl(url);
  console.log(`Original: ${url}`);
  console.log(`Normalized: ${norm}`);
  console.log("---");
});

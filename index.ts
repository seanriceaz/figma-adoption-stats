//import cTable from 'console.table';
import { FigmaCalculator } from "figma-calculations";
const fs = require('node:fs');
const figmaCalculator = new FigmaCalculator();


// this is the API token for Figma
const API_TOKEN = process.env['FIGMA_API_TOKEN']

//FigmaCalculator.generateStyleBucket()


// these are the Figma Team IDs to retrieve
//https://www.figma.com/files/File_ID/team/Team_ID
const FIGMA_TEAM_IDS = [
  "TEAM ID",
  "TEAM ID"
]

// this is the team id that publishes all of your designs. We'll use the styles from here to check for linting
const FIGMA_STYLE_TEAM_ID = "YOURTEAMIDHERE"

const startProcessing = async () => {
  if (API_TOKEN){
    figmaCalculator.setAPIToken(API_TOKEN)
  } else {
    console.log ('API Token Undefined');
    return false;
  }
  console.log('Fetching File Ids...')
  // fetch all of the files edited in last two weeks
  // note: may take some time
  const { files } = await
    figmaCalculator.getFilesForTeams(FIGMA_TEAM_IDS, 2, true)

  console.log('Fetching Styles...')
  // load up any style libraries
  await figmaCalculator.loadComponents(FIGMA_STYLE_TEAM_ID);
  await figmaCalculator.loadStyles(FIGMA_STYLE_TEAM_ID);

  const allPages = [];

  if (files.length === 0) {
    console.log("No Files Ids Retrieved.. Exiting")
    return;
  }
  // Clear the error log
  try{
    fs.writeFile('error.log', '', err => {});
  } catch (e){
    console.log("There was a problem clearing the error log");
  }
   
  //Loop through the files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // you can further optimize by tossing out certain file names
    try {
      await figmaCalculator.fetchCloudDocument(file.key);
    } catch (ex) {
      console.log(`Failed to fetch ${file.key}. Retrying with limited node depth.`);
      //Log the error to a file.
      try{
        fs.appendFile('error.log', JSON.stringify(ex), err => {})
      } catch (err){
        console.log("There was a problem adding to the error log");
      }
      // Try with a depth limit of 5
      try {
        await figmaCalculator.fetchCloudDocument(file.key, 5);
      } catch (e) {
        console.log("Retry failed");
        try{
          fs.appendFile('error.log', JSON.stringify(e), err => {})
        } catch (err){
          console.log("There was a problem adding to the error log");
        }
        continue;
      }
    }

    console.log(`Processing file ${i + 1} of ${files.length} - ${file.name} | Project: ${file.projectName} | Team: ${file.teamName}`);
  
    // run through all of the pages and process them
    for (const page of figmaCalculator.getAllPages()) {
      const processedNodes = figmaCalculator.processTree(page);

      const pageDetails = {
        file,
        pageAggregates: processedNodes.aggregateCounts,
        pageName: page.name,
      };
      allPages.push(pageDetails);
    }
  }

  const teamBreakdown = figmaCalculator.getBreakDownByTeams(allPages);

  printTeamTable(teamBreakdown)

}

startProcessing();


function printTeamTable(teamBreakdown: any) {
  const { totals: { adoptionPercent, lintPercentages }, teams } = teamBreakdown;


  console.log("Your Figma Stats")
  console.log("------------------------------------")
  console.log(`Component Adoption: ${adoptionPercent}%`)
  console.log(`Text Style Full Match: ${lintPercentages['Text-Style'].full}`)
  console.log(`Fill Style Full Match: ${lintPercentages['Fill-Style'].full}`)

  const flatTeams = [];
  for (const teamName of Object.keys(teams)) {
    const { adoptionPercent, lintPercentages } = teams[teamName];
    flatTeams.push({
      teamName,
      adoptionPercent,
      fillMatch: lintPercentages['Fill-Style'].full,
      textMatch: lintPercentages['Text-Style'].full,
    })
  }
  console.table(flatTeams)
}

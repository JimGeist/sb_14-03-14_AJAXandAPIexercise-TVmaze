/** Given a query string, return array of matching shows:
 *     { id, name, summary, episodesUrl }
 */

/** Search Shows
 *    - given a search term, search for tv shows that
 *      match that query.  The function is async show it
 *       will return a promise.
 *
 *   - Returns an array of objects. Each object should include
 *     following show information:
 *    {
        id: <text, show id>,
        name: <text, show name>,
        summary: <text, show summary>,
        image: <object, medium and original image from the show data. null / no image is possible>
      }
 */
async function searchShows(query) {

  // Make an ajax request to the tv maze searchShows api. 
  // query must have a value 

  // replace embedded spaces with % 20
  let fixedSearch = query.split(" ").join("%20");

  try {
    const url = `http://api.tvmaze.com/search/shows?q=${fixedSearch}`;
    const res = await axios.get(url);

    if (res.status === 200) {
      if (res.data.length > 0) {
        const outShows = [];
        for (let showObj of res.data) {
          outShows.push(buildShowObject(showObj.show.id, showObj.show.name, showObj.show.summary, showObj.show.image))
        }
        if (outShows.length === 0) {
          outShows.push(buildShowObject(0, "We are experiencing operating difficulties...",
            `Something bad happened while processing the ${res.data.length} show(s) found for search of '${query}'.`,
            { medium: "./images/VectorStock.com-18175384.jpg" }));
        }
        return outShows;

      } else {
        // nothing was found
        return [buildShowObject(0, "Oh SNAP!",
          `No shows were found for '${query}'. Please change your search and try again. <br><br>TVmaze response code = ${res.status}.`, "")];
      }

    } else {
      return [buildShowObject(0, "We are experiencing operating difficulties...",
        `Show search for '${query}' was not successful. <br><br>(TVmaze response code = ${res.status}).`,
        { medium: "./images/VectorStock.com-18175384.jpg" })];
    }

  } catch (e) {
    return [buildShowObject(0, "We are experiencing operating difficulties...",
      `An unexpected error (${e.message}) occurred while connecting to TVmaze. Search for '${query}' was not performed.`,
      { medium: "./images/VectorStock.com-18175384.jpg" })];
  }

}


function buildErrorObject(id, errorHeadline, errorDesc, errorImage) {

  return {
    id,
    name: errorHeadline,
    summary: errorDesc,
    image: errorImage
  }

}


async function searchShowsOrGetEpisodes(tvMazeUrl, errObj, fxDataProc, inShowName) {

  // Make an ajax request to the tv maze api. 
  // tvMazeUrl holds the api url for either a show search or to get episodes 
  // fxDataProc holds the name of function to process the shows returned from a show search 
  //  or the episodes from get episodes.
  // errOjb contains the error messages to display for either show search or get episodes api calls 
  //  for nothing found, status is not 200, or unexpected errors. 

  try {
    const res = await axios.get(tvMazeUrl);

    if (res.status === 200) {
      if (res.data.length > 0) {
        const outData = fxDataProc(res.data, inShowName);

        return outData;

      } else {
        // nothing was found
        return [buildErrorObject("ERROR", errObj.errNothingFound.errHeadline,
          `${errObj.errNothingFound.errDesc}TVmaze response code = ${res.status}.`,
          errObj.errNothingFound.image)];
        // return [buildShowObject(0, "Oh SNAP!",
        //   `No shows were found for '${query}'. Please change your search and try again. <br><br>TVmaze response code = ${res.status}.`, "")];
        // nothingFound
        //  No episodes were found for '<showName>'. <><>
      }

    } else {
      // return [buildShowObject(0, "We are experiencing operating difficulties...",
      //   `Show search for '${query}' was not successful. <br><br>(TVmaze response code = ${res.status}).`,
      //   { medium: "./images/VectorStock.com-18175384.jpg" })];

      return [buildErrorObject("ERROR", errObj.errNot200.errHeadline,
        `${errObj.errNot200.errDesc}TVmaze response code = ${res.status}.`,
        errObj.errNot200.image)];
      // not200  
      // Episode search for '<showName>' was not successful. 
    }

  } catch (e) {
    // return [buildShowObject(0, "We are experiencing operating difficulties...",
    // `An unexpected error (${e.message}) occurred while connecting to TVmaze. Search for '${query}' was not performed.`,
    // { medium: "./images/VectorStock.com-18175384.jpg" })];
    return [buildErrorObject("ERROR", errObj.errUnexpected.errHeadline,
      `An unexpected error (${e.message}) occurred while connecting to TVmaze. ${errObj.errUnexpected.errDesc}`,
      errObj.errUnexpected.image)];
    // unexpected
  }

}


/** Build Shows Array
 * Function processes the data from the api and returns an array of objects for the shows that includes
 * id, name, summary, and image for the found shows. 
 * 
 * @param {*} inShows is the array of objects returned as data in the api call
 */
function buildShowsArray(inShows, inQuery) {

  const outShows = [];

  for (let showData of inShows) {
    let imageUrl = "";

    if (showData.show.image) {
      if (showData.show.image.medium) {
        // we have an inImageObject.
        imageUrl = showData.show.image.medium;
      } else {
        imageUrl = "./images/tv-missing.png";
      }
    } else {
      imageUrl = "./images/tv-missing.png";
    }

    outShows.push({
      id: showData.show.id,
      name: showData.show.name,
      summary: showData.show.summary,
      image: imageUrl
    });
  }

  if (outShows.length === 0) {
    outShows.push(buildErrorObject("ERROR", "We are experiencing operating difficulties...",
      `Something bad happened while processing the ${inShows.length} show(s) found for search of '${inQuery}'.`,
      "./images/VectorStock.com-18175384.jpg"));
  }

  return outShows;

}



/** Build Show Object
 *
 *   - Returns a show object that includes the following 
 *      show information:
 *    {
        id: <show id>,
        name: <show name>,
        summary: <show summary>,
        image: <an image from the show data, or a default image if no image exists, (image isn't needed until later)>
      }
 */
function buildShowObject(id, name, summary, inImageObject) {

  // do something with the image to ensure we have one to return.
  // Images: http://www.tvmaze.com/api#show-image
  //  look for medium, then original and finally use the tv image when there is 
  //  no image.
  const imgUrlMed = {};

  if (inImageObject) {
    if (inImageObject.medium) {
      // we have an inImageObject.
      imgUrlMed.medium = inImageObject.medium;
    } else {
      imgUrlMed.medium = "./images/tv-missing.png";
    }
  } else {
    imgUrlMed.medium = "./images/tv-missing.png";
  }

  return {
    id,
    name,
    summary,
    image: imgUrlMed.medium
  };

}


/** Populate shows list:
 *     - given list of shows, add shows to DOM
 */

function populateShows(shows) {
  const $showsList = $("#shows-list");
  $showsList.empty();

  let btnEpisode = "";

  // Do not display the episode button when an error occurred. 
  // When there was an error, shows array will have 1 'show', the error message.
  if (shows[0].id !== "ERROR") {
    btnEpisode = `      <a href="#" class="d-block mt-3 btn btn-lg btn-primary">Episodes</a>`;
  }

  for (let show of shows) {
    let $item = $(
      `<div class=" col-md-6 col-lg-3 Show" data-show-id="${show.id}">
           <div class="card" data-show-id="${show.id}">
             <div class="card-body">
               <h5 class="card-title">${show.name}</h5>
               <p class="card-text">${show.summary}</p>
               <img class="card-img-top" src="${show.image}">
               ${btnEpisode}
             </div>
           </div>
         </div>
        `);

    $showsList.append($item);
  }

}


/** get Episodes
 *    - given a Show Id, get the list of episoded for the tv show. The function is 
 *       async show it will return a promise.
 *
 *   - Returns an array of objects. Each object should include
 *     following show information:
 *    {
        id: <number, id number for episode>
        name: <text, episode name>,
        season: <number, season number>,
        number: <number, episode number for the season>,
        summary: <text, episode summary>,
        url: <url for punchout to the tv maze page about the episode>
      }
 */
async function getEpisodes(showId) {

  // Make an ajax request to the tv maze shows api for an episode list. 
  // showId must have a value and this should be checked in the function that calls
  //  searchEpisodes


  try {
    const url = `http://api.tvmaze.com/shows/${showId}/episodes`;
    const res = await axios.get(url);

    console.dir(res);

    if (res.status = 200) {
      if (res.data.length > 0) {
        const outEpisodes = buildEpisodesArray(res.data);
        // for (let episodeObj of res.data) {
        //   outEpisodes.push(buildShowObject("", "", "", "", ""));
        // }
        // if (outEpisodes.length === 0) {
        //   // outEpisodes.push(buildShowObject(0, "We are experiencing operating difficulties...",
        //   //   `Something bad happened while processing the ${res.data.length} episodes for show(s) found for search of '${showId}'.`,
        //   //   { medium: "./images/VectorStock.com-18175384.jpg" }));
        // }
        return outEpisodes;

      } else {
        // nothing was found
        // return [buildShowObject(0, "Oh SNAP!",
        //   `No shows were found for '${showId}'. Please change your search and try again. <br><br>TVmaze response code = ${res.status}.`, "")];
      }

    } else {
      // return [buildShowObject(0, "We are experiencing operating difficulties...",
      //   `Show search for '${showId}' was not successful. <br><br>(TVmaze response code = ${res.status}).`,
      //   { medium: "./images/VectorStock.com-18175384.jpg" })];
    }

  } catch (e) {
    // return [buildShowObject(0, "We are experiencing operating difficulties...",
    //   `An unexpected error (${e.message}) occurred while connecting to TVmaze. Search for '${showId}' was not performed.`,
    //   { medium: "./images/VectorStock.com-18175384.jpg" })];
  }

}


/** Build Episodes Object
 *    - builds an episodes array of object that includes the following information:
 *    {
        name: <text, episode name>,
        season: <number, season number>,
        number: <number, episode number for the season>,
        summary: <text, episode summary>,
        url: <url for punchout to the tv maze page about the episode>
      }
 */
function buildEpisodesArray(inEpisodes, inShowName) {

  const outEpisodes = [];

  for (let episode of inEpisodes) {
    outEpisodes.push({
      id: episode.id,
      name: episode.name,
      season: episode.season,
      number: episode.number,
      summary: episode.summary,
      url: episode.url
    });
  }

  if (outEpisodes.length === 0) {
    outEpisodes.push(buildErrorObject("ERROR", "",
      `Something bad happened while processing <br>the ${inEpisodes.length} episode(s) found for "${inShowName}".`,
      ""));
  }

  return outEpisodes;

}


/** Populate Episodes List
 *  creates a list entry for each episode in the show.
 *   
 */
function populateEpisodesList(inEpisodes, inShowId) {

  const $episodesList = $("#episodes-list");
  $episodesList.empty();

  if (inEpisodes[0].id === "ERROR") {

    let $listItem = $(
      `<li class="" data-episode-id="${inShowId}-${inEpisodes[0].id}">${inEpisodes[0].summary}</li>`);

    $episodesList.append($listItem);

  } else {

    for (let episode of inEpisodes) {
      let $listItem = $(
        `<li class="" data-episode-id="${inShowId}-${episode.id}">
          <a href="${episode.url}" target="${inShowId}">"${episode.name}"</a> 
          (season ${episode.season}, number ${episode.number}) 
          </li>`
      );

      $episodesList.append($listItem);
    }

  }

}


/** Handle search form submission:
 *    - hide episodes area
 *    - get list of matching shows and show in shows list
 */

$("#search-form").on("submit", async function handleSearch(evt) {
  evt.preventDefault();

  // trim any leading and trailing spaces from the value entered in search query.
  let query = $("#search-query").val().trim();
  if (!query) return;

  $("#episodes-area").hide();

  let queryFixed = query.split(" ").join("%20")

  const searchErrors = {
    errNothingFound: {
      errHeadline: "Oh SNAP!",
      errDesc: `No shows were found for '${query}'. Please change your search and try again. <br><br>`,
      image: "./images/tv-missing.png"
    },
    errNot200: {
      errHeadline: "We are experiencing operating difficulties...",
      errDesc: `Show search for '${query}' was not successful. <br><br>`,
      image: "./images/VectorStock.com-18175384.jpg"
    },
    errUnexpected: {
      errHeadline: "We are experiencing operating difficulties...",
      errDesc: `Search for '${query}' was not performed.`,
      image: "./images/VectorStock.com-18175384.jpg"
    }
  }

  let apiUrl = `http://api.tvmaze.com/search/shows?q=${queryFixed}`
  let shows = await searchShowsOrGetEpisodes(apiUrl, searchErrors, buildShowsArray, query);

  populateShows(shows);
});


/** Clicking on Episodes 'button' will perform episode search 
 * 
*/
$("#shows-list").on("click", "a", async function () {

  //const $topShowDiv = $(this).parent().parent().parent();
  //const $topShowDiv = $(this).closest("div.col-md-6.col-lg-3");
  const $topShowDiv = $(this).parents("div.Show");

  //const showId = +$(this).parent().parent().attr("data-show-id");
  const showId = +$(this).closest("div.card").attr("data-show-id");
  const showName = $(this).siblings("h5").text();

  if (showId > 0) {

    const getEpisodeErrors = {
      errNothingFound: {
        errHeadline: "",
        errDesc: `No episodes were found for '${showName}'. <br>`,
        image: ""
      },
      errNot200: {
        errHeadline: "",
        errDesc: `Episode listing for '${showName}' was not successful. <br>`,
        image: ""
      },
      errUnexpected: {
        errHeadline: "",
        errDesc: ` <br>Episode listing for '${showName}' was not performed.`,
        image: ""
      }
    }

    let apiUrl = `http://api.tvmaze.com/shows/${showId}/episodes`
    let episodes = await searchShowsOrGetEpisodes(apiUrl, getEpisodeErrors, buildEpisodesArray, showName);
    populateEpisodesList(episodes, showId);

    // hide all shows except for the show we have episodes for
    $("div.Show").css("display", "none");
    $($topShowDiv).css("display", "");

    // Unhide the episode portion of the page
    $("#episodes-area").css("display", "");

  }

})
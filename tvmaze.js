/** Given a query string, return array of matching shows:
 *     { id, name, summary, episodesUrl }
 */


/** buildErrorObject builds the error object to mirror the show object since
 *   it includes only id, name, summary, and image. The same error definition 
 *   is used for get episodes. When episode information is built for the DOM, 
 *   we need to check for an error first since episode information includes
 *   details that are not part of the error object.
 * 
 * @param {*} id - id, set to "ERROR"
 * @param {*} errorHeadline - cheeky short description of the error that 
 *             appears in the show name part of the show card. errorHeadline
 *             is not used when an episode error occurs.
 * @param {*} errorDesc - detailed error description that appears in the summary
 *             portion for the show OR the list main text for the episode. 
 * @param {*} errorImage - image to use for search show error. image is not used
 *             for episode errors.
 */
function buildErrorObject(id, errorHeadline, errorDesc, errorImage) {

  return {
    id,
    name: errorHeadline,
    summary: errorDesc,
    image: errorImage
  }

}


/** Search Shows OR Get Episodes
 *  The function is async show it will return a promise.
 *  - Function serves a dual purpose of utilizing the api.tvmaze.com to either
 *     search for shows based on a search term or get the episodes when provided 
 *     a show id. 
 *  - the function that builds the DOM elements MUST check the first array element.
 *  - function returns an array of objects that contain either show details or 
 *     episodes. The function to process the data returned by the api call 
 *     is passed in as a parameter (really cool to have the ability to do that).
 *    When a show search is performed, each show object includes the following
 *     show information:
 *    {
        id: <text, show id>,
        name: <text, show name>,
        summary: <text, show summary>,
        image: <object, medium and original image from the show data. null / no image is possible>
      }
 *    When get episodes performed, each episode object includes the following
 *     episode information:
 *    {
        id: <number, id number for episode>
        name: <text, episode name>,
        season: <number, season number>,
        number: <number, episode number for the season>,
        summary: <text, episode summary>,
        url: <url for punchout to the tv maze page about the episode>
      }
 * 
 * @param {*} tvMazeUrl - the url that ultimate determines what information we want from 
 *             the TVmaze API.
 *             for show search:  https://api.tvmaze.com/search/shows?q=:searchString
 *             for get episodes: https://api.tvmaze.com/shows/:showId/episodes
 * @param {*} errObj - error object is set up prior to calling searchShowsOrGetEpisodes
 *             and it contains the appropriate error messages for nothing found, status not
 *             200, and unexpected errors for search for shows or get episodes api calls.
 * @param {*} fxDataProc - the function needed to process the data returned from the api
 *             call. Show require show id, show name, show summary and an image while 
 *             episodes require episode id, episode name, seaason, episode number in season,
 *             episode summary, and a url to link to a TVmaze page that has more details
 *             about episode
 * @param {*} inErrQueryOrName - supports enhanced error messaging. When searching for shows,
 *             inErrQueryOrName contains the query / search name while for get episodes,
 *             it contains the name of the show.
 */
async function searchShowsOrGetEpisodes(tvMazeUrl, errObj, fxDataProc, inErrQueryOrName) {

  // Make an ajax request to the tv maze api. 

  try {
    const res = await axios.get(tvMazeUrl);

    if (res.status === 200) {
      if (res.data.length > 0) {
        const outData = fxDataProc(res.data, inErrQueryOrName);

        return outData;

      } else {
        // nothing was found
        return [buildErrorObject("ERROR", errObj.errNothingFound.errHeadline,
          `${errObj.errNothingFound.errDesc}TVmaze response code = ${res.status}.`,
          errObj.errNothingFound.image)];
      }

    } else {
      return [buildErrorObject("ERROR", errObj.errNot200.errHeadline,
        `${errObj.errNot200.errDesc}TVmaze response code = ${res.status}.`,
        errObj.errNot200.image)];
    }

  } catch (e) {
    return [buildErrorObject("ERROR", errObj.errUnexpected.errHeadline,
      `An unexpected error (${e.message}) occurred while connecting to TVmaze. ${errObj.errUnexpected.errDesc}`,
      errObj.errUnexpected.image)];
  }

}


/** buildShowsArray
 *  Function processes the show data from the api and returns an array of objects for the shows 
 *  that includes id, name, summary, and image for the found shows. 
 * 
 * @param {*} inShows is the array of objects returned as data in the api call.
 * @param {*} inQuery contains the text used in the show search. The show search value
 *             appears if something goes wrong when assembling the show array. 
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

  // This bit-o-code should never run. But if something goes wrong while building the
  //  show array, a meaningful message should appear on the page.
  if (outShows.length === 0) {
    outShows.push(buildErrorObject("ERROR", "We are experiencing operating difficulties...",
      `Something bad happened while processing the ${inShows.length} show(s) found for search of '${inQuery}'.`,
      "./images/VectorStock.com-18175384.jpg"));
  }

  return outShows;

}


/** populateShows
 *  Function adds show details for each show in the shows array to the DOM.
 * 
 * @param {*} shows - an array of show objects that contains id, name, summary, and image for each show 
 *             matching the search criteria. shows[0] contains the details any error that occurred.
 */
function populateShows(shows) {
  const $showsList = $("#shows-list");
  $showsList.empty();

  let btnEpisode = "";

  // Do not display the episode button when an error occurred. 
  // When there was an error, shows array will have 1 'show', the error message. 
  // For errors:
  //  id contains "ERROR"
  //  name contains a cheeky short error description.
  //  summary contains a detailed error description.
  //  image contains an image for the error.
  if (shows[0].id !== "ERROR") {
    btnEpisode = `      <a href="#" class="d-block mt-3 btn btn-lg btn-primary" data-bs-toggle="modal" data-bs-target="#episodeModal">Episodes</a>`;
  }

  for (let show of shows) {
    let $item = $(
      `<div class=" col-md-6 col-lg-3 Show" data-show-id="${show.id}">
           <div class="card" data-show-id="${show.id}">
             <div class="card-body">
               <h3 class="card-title">${show.name}</h3>
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


/** buildEpisodesArray
 *  Function processes the episode data from the api and returns an array of objects for a 
 *  particular show's episodes. Episode details include id, name, season, number, summary and url.
 * 
 * @param {*} inEpisodes is the array of objects returned as data in the api call for 
 *             episodes.
 * @param {*} inShowName contains the name of the show to use in the error message generated
 *             by the procedure when something goes wrong when assemply the episodes array.
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


/** populateEpisodesModal
 *  Function adds episode details to the modal episode DOM element for each show episode in the inEpisodes array.
 * 
 * @param {*} inEpisodes - an array of episode objects that contains id, name, season, number, summary and url 
 *             for all show episodes. inEpisodes[0] contains the details of any erros that occurred.
 * @param {*} inShowId - provides the page name used when link for for additional episode details is clicked.
 * @param {*} inShowName - the name of the show for the episode list modal header element
 */
function populateEpisodesModal(inEpisodes, inShowId, inShowName) {

  //const $episodesList = $("#episodes-list");
  const $episodesList = $("#episodes-modal");
  $episodesList.empty();

  $("#episodeModalLabel").text(`"${inShowName}" Episodes`)
  //episodeModalLabel

  if (inEpisodes[0].id === "ERROR") {

    let $listItem = $(
      `<li class="" data-episode-id="${inShowId}-${inEpisodes[0].id}">${inEpisodes[0].summary}</li>`);

    $episodesList.append($listItem);

    return "ERROR"

  } else {

    for (let episode of inEpisodes) {
      let $listItem = $(
        `<li class="" data-episode-id="${inShowId}-${episode.id}">
          <a href="${episode.url}" target="${inShowId}">"<strong>${episode.name}</strong>"</a> 
          (season ${episode.season}, number ${episode.number}) 
          </li>`
      );

      $episodesList.append($listItem);
    }

    return "OK"

  }

}


/** Handle search form submission:
 *    - hide episodes area / never used since modal window is used to diplay episodes.
 *    - get list of matching shows and show in shows list
 */

$("#search-form").on("submit", async function handleSearch(evt) {
  evt.preventDefault();

  // trim any leading and trailing spaces from the value entered in search query.
  let query = $("#search-query").val().trim();
  if (!query) return;

  $("#episodes-area").hide();

  // clean the input -- change spaces to %20, remove ' and "
  let queryFixed = query.split(" ").join("%20");
  queryFixed = queryFixed.split("'").join();
  queryFixed = queryFixed.split('"').join();

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

  let apiUrl = `https://api.tvmaze.com/search/shows?q=${queryFixed}`
  let shows = await searchShowsOrGetEpisodes(apiUrl, searchErrors, buildShowsArray, query);

  populateShows(shows);
});


/** Clicking on Episodes 'button' gets the episodes for the show.
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
    // Build the getEpisode appropriate errors
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

    let apiUrl = `https://api.tvmaze.com/shows/${showId}/episodes`
    let episodes = await searchShowsOrGetEpisodes(apiUrl, getEpisodeErrors, buildEpisodesArray, showName);
    //populateEpisodesList(episodes, showId);

    if (populateEpisodesModal(episodes, showId, showName) === "OK") {
      // Everything is OK. Add the number of episodes to the message
      // p class="episode-ctr
      if (episodes.length > 1) {
        $("p.episode-ctr").text(`${episodes.length} episodes`);
      } else {
        $("p.episode-ctr").text(`${episodes.length} episode`);
      }

    } else {
      // An error was found in the episode information. Clear the message
      $("p.episode-ctr").text("");
    }

    // Code no longer needed with the use of modal.
    // // hide all shows except for the show we have episodes for
    // $("div.Show").css("display", "none");
    // $($topShowDiv).css("display", "");

    // // Unhide the episode portion of the page
    // $("#episodes-area").css("display", "");

  }

})

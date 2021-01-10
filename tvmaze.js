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

    if (res.status = 200) {
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
      //inImageObject.original);

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

  for (let show of shows) {
    let $item = $(
      `<div class=" col-md-6 col-lg-3 Show" data-show-id="${show.id}">
         <div class="card" data-show-id="${show.id}">
           <div class="card-body">
             <h5 class="card-title">${show.name}</h5>
             <p class="card-text">${show.summary}</p>
             <img class="card-img-top" src="${show.image}">
             <a href="#" class="d-block mt-3 btn btn-lg btn-primary">Episodes</a>
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
function buildEpisodesArray(inEpisodes) {

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

  return outEpisodes;

}


/** Populate Episodes List
 *  creates a list entry for each episode in the show.
 *   
 */
function populateEpisodesList(inEpisodes, inShowId) {

  const $episodesList = $("#episodes-list");
  $episodesList.empty();

  for (let episode of inEpisodes) {
    let $listItem = $(
      `<li class="" data-episode-id="${inShowId}-${episode.id}">
        "${episode.name}" (season ${episode.season}, number ${episode.number}) 
        <a href="${episode.url}" target="${inShowId}">more...</a></li>
      `);

    $episodesList.append($listItem);
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

  let shows = await searchShows(query);

  populateShows(shows);
});


/** Clicking on Episodes 'button' will perform episode search 
 * 
*/
$("#shows-list").on("click", "a", async function () {

  const $topShowDiv = $(this).parent().parent().parent();

  const showId = +$(this).parent().parent().attr("data-show-id");

  if (showId > 0) {
    let episodes = await getEpisodes(showId);
    populateEpisodesList(episodes, showId);

    // hide all shows except for the show we have episodes for
    $("div.col-md-6.col-lg-3").css("display", "none");
    $($topShowDiv).css("display", "");

    // Unhide the episode portion of the page
    $("#episodes-area").css("display", "");

  }

})
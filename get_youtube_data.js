import {google} from 'googleapis';
import ytData from './yt_data.js';

var plID = ytData.playlist;
var chanID = ytData.chan_id;

const youtube = google.youtube({
    version:'v3',
    auth: ytData.yt_token
});

var pageData = {};
var totalResults = 0;

function getPlaylistItems(playlistID) {
    return new Promise(async(resolve, reject) =>{
        plID = playlistID;
        const res = await youtube.playlistItems.list({
            part:'id,snippet,contentDetails,status',
            playlistId:plID,
            maxResults:50
        }).catch((err) => {reject(err)})
        console.log(res.data);
        totalResults += res.data.items.length;
        pageData.nextPageToken = res.data.nextPageToken;
        pageData.pageInfo = res.data.pageInfo;
        resolve(res.data)
    })
}

function next(){
    return new Promise(async(resolve, reject) =>{
        const res = await youtube.playlistItems.list({
            part:'id,snippet,contentDetails,status',
            playlistId:plID,
            maxResults:50,
            pageToken: pageData.nextPageToken
        })
        console.log(res.data)
    })
}

getPlaylistItems('PL6c6yEE5wGqkudaFVwi_OtAodcweym7T0')
    .then((ret) => next())
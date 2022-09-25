import {google} from 'googleapis';
import ytData from './yt_data.js';
import youtubeDlExec from 'youtube-dl-exec';
import fs from 'fs';
//import { Puppeteer } from 'puppeteer';

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
    })
}

function downloadYTVids(){
    return new Promise(async (resolve, reject) => {
        //get page
        let YTPage = await getPlaylistItems(plID)
        //iterate through page
        //for(let video in YTPage.items){
            let subprocess = youtubeDlExec.exec("https://www.youtube.com/watch?v="+YTPage.items[0].contentDetails.videoId,{
                //dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                  'referer:youtube.com',
                  'user-agent:googlebot'
                ],
                extractAudio: true,
                audioFormat: "mp3",
                splitChapters: true,
                ffmpegLocation: "C:\\ffmpeg\\bin"
              
            })

        //subprocess.stdout.pipe(fs.createWriteStream('stdout.txt'))
        subprocess.stdout.on('data', (data) => {
            //parse output of yt-dlp
            let stringData = data.toString()
            //look for chapter slitter output
            if(stringData.split(" ")[0] == "[SplitChapters]"){
                let lines = stringData.split(/\r?\n/)
                for(let line in lines){
                    //look for chapter name
                    let dashSplit = lines[line].split(" - ")
                    if(dashSplit[dashSplit.length - 1].toUpperCase().includes(ytData.chapter.toUpperCase())){
                        //split out file name
                        let destSplit = lines[line].split("; Destination: ")
                        console.log(destSplit[1])
                    }
                }
            }
        });
        subprocess.stdout.on('error', (data) => {console.log(data)})
        //subprocess.stderr.pipe(fs.createWriteStream('stderr.txt'))

        //subprocess.on('exit', function(){
            //uploadToAnchor("")
        //})

        setTimeout(subprocess.cancel, 30000)
        //}
        //get next page
        //getPlaylistItems(plID)
        //    .then((ret) => next())
    })
}

downloadYTVids()
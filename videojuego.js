// Keep the two demonstrations from playing over each other.
const videos=[...document.querySelectorAll('video')];
videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause();})));

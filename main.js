import { YT_API_KEY } from './config.js';

const pad = n => n < 10 ? '0' + n : n;

class Video {
  constructor() {
    this.id = '';
    this.title = '';
    this.thumb = '';
    this.description = '';
    this.channelName = '';
    this.channelId = '';
    this.viewCount = 0;
    this.likeCount = 0;
    this.commentCount = 0;
    this.favoriteCount = 0;
    this.publishedAt = new Date();
    this.duration = 'unknown';
  }

  dateDiff() {
    const dateDiff = new Date(new Date() - new Date(this.publishedAt));
    const years = dateDiff.getFullYear() - 1970;
    const months = dateDiff.getUTCMonth();
    const days = dateDiff.getUTCDate() - 1;

    return `${years > 0 ? years+'y' : ''}`
      + ` ${months > 0 ? months+'m' : ''}`
      + ` ${days > 0 ? days+'d' : ''}`;
  }

  get seconds() {
    const { h, m, s } = this.duration;
    return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
  }

  get durationString() {
    const { h, m, s } = this.duration;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  static fromJSON(json) {
    const video = new Video();
    video.id = json.id.videoId;
    video.thumb = json.snippet.thumbnails.default.url;
    video.title = json.snippet.title;
    video.description = json.snippet.description;
    video.channelName = json.snippet.channelTitle;
    video.channelId = json.snippet.channelId;
    video.publishedAt = new Date(json.snippet.publishedAt);
    video.duration = 'unknown';
    return video;
  }

  toHTML() {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('video');
    itemDiv.id = this.id;

    const thumb = document.createElement('img');
    thumb.classList.add('thumb');
    thumb.src = this.thumb;
    itemDiv.appendChild(thumb);

    const info = document.createElement('div');
    info.classList.add('info');
    itemDiv.appendChild(info);

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerHTML = this.title;
    info.appendChild(title);

    const desc = document.createElement('div');
    desc.classList.add('desc');
    desc.innerText = this.description;
    info.appendChild(desc);

    const infoFooter = document.createElement('div');
    infoFooter.classList.add('info-footer');
    info.appendChild(infoFooter);

    const duration = document.createElement('div');
    duration.classList.add('duration');
    duration.innerText = this.durationString;
    infoFooter.appendChild(duration);

    const publishedAt = document.createElement('div');
    publishedAt.innerText = this.dateDiff();
    publishedAt.classList.add('published-at');
    infoFooter.appendChild(publishedAt);

    const publishedAtDate = document.createElement('span');
    publishedAtDate.classList.add('published-at-date');
    publishedAtDate.innerText = new Date(this.publishedAt).toUTCString();
    publishedAt.appendChild(publishedAtDate);

    const channel = document.createElement('div');
    const channelLink = document.createElement('a');
    channelLink.href = `https://www.youtube.com/channel/${this.channelId}`;
    channelLink.innerText = this.channelName;
    channelLink.setAttribute('target', '_blank');
    channel.classList.add('channel');
    channel.appendChild(channelLink);
    infoFooter.appendChild(channel);

    const views = document.createElement('div');
    views.classList.add('views');
    views.innerText = this.viewCount + ' views';
    infoFooter.appendChild(views);

    const likes = document.createElement('div');
    likes.classList.add('likes');
    likes.innerText = this.likeCount + ' likes';
    infoFooter.appendChild(likes);

    const comments = document.createElement('div');
    comments.classList.add('comments');
    comments.innerText = this.commentCount + ' comments';
    infoFooter.appendChild(comments);

    const favs = document.createElement('div');
    favs.classList.add('favs');
    favs.innerText = this.favoriteCount + ' favorites';
    infoFooter.appendChild(favs);

    itemDiv.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      window.open(`https://www.youtube.com/watch?v=${this.id}`, '_blank');
    });

    return itemDiv;
  }
};

class VideoRepository {
  constructor() {
    this.reset();
  }

  reset() {
    this.videos = [];
    this.nextPage = null;
    this.pagesFetched = 0;
  }

  async loadVideos(query) {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    const params = url.searchParams;
    params.set('part', 'snippet');
    params.set('q', query);
    params.set('type', 'video')
    params.set('key', YT_API_KEY);
    params.set('maxResults', 50);
    params.set('relevanceLanguage', 'pl');
    params.set('safeSearch', 'none');

    const publishedBefore = document.getElementById('published-before').value;
    const publishedAfter = document.getElementById('published-before').value;

    if (publishedBefore !== '') {
      params.set('publishedBefore', new Date(publishedBefore).toISOString());
    }

    /*
    if (publishedAfter !== '') {
      params.set('publishedAfter', publishedAfter + 'Z');
    }
    */

    const minDuration = parseInt(document.getElementById('min-duration').value);

    if (!isNaN(minDuration) && minDuration >= 20) {
      params.set('videoDuration', 'long');
    }

    if (this.nextPage) {
      params.set('pageToken', this.nextPage);
    }

    const res = await fetch(url.toString());
    const json = await res.json();
    console.log(json);
    const newVideos = json.items.map(item => Video.fromJSON(item));
    this.pagesFetched++;
    this.nextPage = json.nextPageToken;
    this.videos = this.videos.concat(newVideos);
    let pageLimit = parseInt(document.getElementById('page-count').value);
    if (isNaN(pageLimit)) {
      pageLimit = 1;
    }

    if (this.nextPage && this.pagesFetched < pageLimit) {
      await this.loadVideos(query);
    }

    await this.updateDuration();
    return this;
  }

  render() {
    const resultCountDiv = document.getElementById('result-count');
    resultCountDiv.innerText = `${this.videos.length} result(s)`;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    for (const video of this.videos) {
      resultsDiv.appendChild(video.toHTML());
    }
  }

  getVideoByID(id) {
    return this.videos.filter(video => video.id === id)?.[0];
  }

  async updateDuration() {
    const unknownVideos = this.videos.filter(video => video.duration === 'unknown');
    const allUnknownIDs = unknownVideos.map(video => video.id);

    while (allUnknownIDs.length > 0) {
      const unknownIDs = allUnknownIDs.splice(0, 50);

      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      const params = url.searchParams;
      params.set('part', 'contentDetails,statistics');
      params.set('id', unknownIDs.join(','));
      params.set('key', YT_API_KEY);

      const res = await fetch(url.toString());
      const json = await res.json();
      console.log(json);

      const items = json.items;
      for (let item of items) {
        const video = this.getVideoByID(item.id);
        if (video) {
          try {
            const [_, h, m, s] = item.contentDetails
              .duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            video.duration = {
              h: h ? parseInt(h) : 0,
              m: m ? parseInt(m) : 0,
              s: s ? parseInt(s) : 0,
            };
            video.viewCount = item.statistics.viewCount;
            video.likeCount = item.statistics.likeCount;
            video.commentCount = item.statistics.commentCount;
            video.favoriteCount = item.statistics.favoriteCount;
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
    return this;
  }

  sortByDuration() {
    this.videos.sort((v1, v2) => {
      return v2.seconds - v1.seconds;
    });
    this.videos = this.videos.filter(
      video => video.seconds >= parseInt(document.getElementById('min-duration').value * 60));
  }
};

const vidRepo = new VideoRepository();

const inputField = document.getElementById('yt-query');

inputField.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const results = document.getElementById('results');
    results.innerHTML = '';
    vidRepo.reset();
    vidRepo.loadVideos(inputField.value).then(vr => {
      vr.sortByDuration();
      vr.render();
    });
  }
});

document.getElementById('expand-options-btn').addEventListener('click', e => {
  const opts = document.getElementById('options');
  opts.style.display = opts.style.display === 'flex' ? 'none' : 'flex';
});

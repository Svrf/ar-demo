const Svrf = require('svrf-client');

const api = new Svrf('key');
const mediaApi = api.media;

const trending = {
  nextPage: 0,
  cache: [],
};

exports.getTrending = () => {
  if (trending.cache.length) {
    return Promise.resolve(trending.cache);
  }

  return exports.loadMoreTrending();
};

exports.loadMoreTrending = () => {
  const searchOptions = {
    size: 99,
    type: [Svrf.enums.mediaType.PHOTO, Svrf.enums.mediaType.VIDEO],
    pageNum: trending.nextPage,
  };

  return mediaApi.getTrending(searchOptions)
    .then(({media, nextPageNum}) => {
      trending.nextPage = nextPageNum;
      trending.cache.push.apply(trending.cache, media);
      return media;
    });
}

const search = { };
let lastTerm;

exports.search = (term) => {
  lastTerm = term;
  if (search[term]) {
    return Promise.resolve(search[term].cache);
  }

  return exports.loadMoreSearch(term);
};

exports.loadMoreSearch = () => {
  if (!search[lastTerm]) {
    search[lastTerm] = {
      nextPage: 0,
      cache: [],
    };
  }

  const searchInfo = search[lastTerm];

  if(searchInfo.isComplete) {
    return Promise.resolve([]);
  }

  const searchOptions = {
    type: [Svrf.enums.mediaType.PHOTO, Svrf.enums.mediaType.VIDEO],
    size: 20,
    pageNum: searchInfo.nextPage,
  };

  return mediaApi.search(lastTerm, searchOptions)
    .then(({media, totalNum, nextPageNum}) => {
      searchInfo.nextPage = nextPageNum;
      searchInfo.cache.push.apply(searchInfo.cache, media);

      if (totalNum === searchInfo.cache.length) {
        searchInfo.isComplete = true;
      }

      return media;
    });
};
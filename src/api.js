const SVRF = require('svrf-client');

const authApi = new SVRF.AuthenticateApi();
const mediaApi = new SVRF.MediaApi();

exports.authenticate = () => {
  return authApi.authenticate(new SVRF.Body('key'))
    .then(({token}) => mediaApi.apiClient.authentications.XAppToken.apiKey = token);
};

const trending = {
  cursor: null,
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
    type: ['video'],
    nextPageCursor: trending.cursor,
  };

  return mediaApi.getTrending(searchOptions)
    .then(({media, nextPageCursor}) => {
      trending.cursor = nextPageCursor;
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
    type: ['photo'],
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
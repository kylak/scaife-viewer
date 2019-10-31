import api from '../../api';
import constants from '../../constants';
import transformTextGroupList from './transforms';
import utils from './utils';

export default {
  [constants.LIBRARY_LOAD_TEXT_GROUP_LIST]: ({ commit }) => {
    const currentVersion = JSON.parse(localStorage.getItem('libraryDataVersion'));
    const libraryData = JSON.parse(localStorage.getItem('libraryData'));

    return api.getLibraryInfo((res) => {
      if (!utils.isCacheValid(res.api_version, currentVersion) || !libraryData) {
        return api.getTextGroupList((data) => {
          // add data to localStorage
          try {
            localStorage.setItem('libraryData', JSON.stringify(data));
            const version = {
              version: res.api_version,
              date: new Date(),
            };
            localStorage.setItem('libraryDataVersion', JSON.stringify(version));
          } catch (e) {
            if (utils.isQuotaExceeded(e)) {
              console.error('localStorage is full!'); // eslint-disable-line no-console
            }
          }
          const {
            textGroups,
            works,
            texts,
            textGroupUrns,
          } = transformTextGroupList(data);

          commit(constants.SET_TEXT_GROUPS, { textGroups, works, texts });
          commit(constants.SET_TEXT_GROUP_URNS, { textGroupUrns });
        });
      }
      const {
        textGroups,
        works,
        texts,
        textGroupUrns,
      } = transformTextGroupList(libraryData);

      commit(constants.SET_TEXT_GROUPS, { textGroups, works, texts });
      commit(constants.SET_TEXT_GROUP_URNS, { textGroupUrns });
      return true;
    });
  },
  [constants.LIBRARY_LOAD_WORK_LIST]: ({ commit }, urn) => api.getCollection(urn, (textGroup) => {
    // To reduce the load on the API, we prepare two vector calls against works
    // and texts.

    // vector for works
    let params = {
      e: textGroup.works.map(work => work.urn.replace(`${textGroup.urn}.`, '')),
    };
    return api.getLibraryVector(textGroup.urn, params, (worksVector) => {
      const workMap = worksVector.collections;

      const e = [];
      textGroup.works.forEach(({ urn: workUrn }) => {
        const work = workMap[workUrn];
        work.texts.forEach(({ urn: textUrn }) => {
          e.push(textUrn.replace(`${textGroup.urn}.`, ''));
        });
      });
      params = { e };

      // vector for texts
      return api.getLibraryVector(textGroup.urn, params, (textsVector) => {
        const textMap = textsVector.collections;

        // finally prepare the works object to store
        const works = [];
        textGroup.works.forEach(({ urn: workUrn }) => {
          const work = workMap[workUrn];
          works.push({
            ...work,
            texts: work.texts.map(({ urn: textUrn }) => textMap[textUrn]),
          });
        });

        commit(constants.SET_WORKS, works);
      });
    });
  }),

  // Probably should move this a getter
  [constants.LIBRARY_FILTER_WORKS]: ({ state, commit }, query) => {
    if (state.allWorks) {
      const works = state.allWorks
        .filter(work => work.label.toLowerCase().indexOf(query.toLowerCase()) !== -1);
      commit(constants.SET_WORKS, works);
    }
  },

  [constants.LIBRARY_RESET_WORKS]: ({ state, commit }) => {
    commit(constants.SET_WORKS, [...state.allWorks]);
  },


  [constants.LIBRARY_LOAD_VERSION_LIST]: ({ commit }, urn) => api.getCollection(urn, (work) => {
    const params = {
      e: work.texts.map(text => text.urn.replace(`${work.urn}.`, '')),
    };
    return api.getLibraryVector(work.urn, params, (textsVector) => {
      const textMap = textsVector.collections;
      const versions = work.texts.map(({ urn: textUrn }) => textMap[textUrn]);
      commit(constants.SET_VERSIONS, versions);
    });
  }),

  [constants.LIBRARY_LOAD_TOC_LIST]: ({ commit }, urn) => api.getCollection(urn, (text) => {
    commit(constants.SET_TOC, text.toc);
  }),

  [constants.LIBRARY_FILTER_TEXT_GROUPS]: ({ state, commit }, query) => {
    if (state.allTextGroups) {
      const textGroups = [];
      state.allTextGroups.forEach((textGroup) => {
        if (textGroup.label.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
          textGroups.push(textGroup);
        } else {
          const works = textGroup.works.filter((work) => {
            const { label } = state.textGroupUrns[work.urn.toString()];
            return label.toLowerCase().indexOf(query.toLowerCase()) !== -1;
          });
          if (works.length > 0) {
            textGroups.push({ ...textGroup, works });
          }
        }
      });
      commit(constants.SET_TEXT_GROUPS, { textGroups });
    }
  },

  [constants.LIBRARY_RESET_TEXT_GROUPS]: ({ state, commit }) => {
    commit(constants.SET_TEXT_GROUPS, { textGroups: [...state.allTextGroups] });
  },

  [constants.LIBRARY_FILTER_TEXT_GROUP_WORKS]: ({ state, commit }, query) => {
    if (state.allTextGroupWorks) {
      const works = [];
      state.allTextGroupWorks.forEach((work) => {
        if (work.label.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
          works.push(work);
        } else {
          const { label } = state.textGroupUrns[work.urn.upTo('textGroup')];
          if (label.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
            works.push(work);
          }
        }
      });
      commit(constants.SET_TEXT_GROUPS, { works });
    }
  },

  [constants.LIBRARY_RESET_TEXT_GROUP_WORKS]: ({ state, commit }) => {
    commit(constants.SET_TEXT_GROUPS, { works: [...state.allTextGroupWorks] });
  },
};

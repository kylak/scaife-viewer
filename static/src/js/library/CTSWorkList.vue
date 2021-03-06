<template>
  <div class="work-list">
    <template v-if="loading">
      <div class="ball-pulse partial-loader">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </template>
    <div v-else-if="error" class="text-center"><b>Error</b>: {{ error }}</div>
    <div v-else>
      <h2>Works</h2>

      <div class="form-group">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            v-model="query"
            placeholder="Find a work..."
            ref="filter-input"
          >
          <div class="input-group-append" v-if="filtered">
            <button class="btn btn-outline-secondary" type="button" @click="clearQuery"><icon name="times"></icon></button>
          </div>
        </div>
      </div>
      <div class="work" v-for="work in works" :key="work.url">
        <h3><a :href="work.url"><b>{{ work.label }}</b></a></h3>
        <div class="card-deck">
          <div class="version-card" v-for="text in work.texts" :key="text.url">
            <div class="card-body">
              <p class="text-subtype">{{ text.kind }}</p>
              <h4 class="card-title"><a :href="text.url">{{ text.label }}</a></h4>
              <p class="card-text">{{ text.description }}</p>
            </div>
            <div class="card-footer">
              <a :href="text.reader_url"><icon name="book"></icon> Read ({{ text.human_lang }})</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const debounce = require('lodash.debounce');
import constants from '../constants';

export default {
  name: 'cts-work-list',
  created() {
    this.loading = true;
    this.$store.dispatch(constants.LIBRARY_LOAD_WORK_LIST, this.$route.params.urn)
      .then(() => {
        this.loading = false;
        this.$nextTick(() => {
          this.$refs['filter-input'].focus();
        });
      })
      .catch((err) => {
        this.loading = false;
        this.error = err.message;
        throw err;
      });
  },
  data() {
    return {
      loading: false,
      error: '',
      query: '',
      filtered: false,
    };
  },
  watch: {
    query() {
      this.filter();
    },
  },
  computed: {
    works() {
      return this.$store.state.library.works;
    }
  },
  methods: {
    clearQuery() {
      this.query = '';
    },
    filter: debounce(
      function f() {
        const query = this.query.trim();
        if (query === '') {
          this.$store.dispatch(constants.LIBRARY_RESET_WORKS);
          this.filtered = false;
        } else {
          this.$store.dispatch(constants.LIBRARY_FILTER_WORKS, query);
          this.filtered = true;
        }
      },
      250,
    ),
  },
};
</script>

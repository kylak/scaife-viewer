<template>
  <base-widget class="passage-reference">
    <span slot="header">Passage Reference</span>
    <div slot="body">
      <input
        v-model="reference"
        v-on:keyup="handleKeyUp"
        v-on:click="handleClick"
        type="text"
        class="form-control form-control-sm"
      >
    </div>
  </base-widget>
</template>

<script>
import ReaderNavigationMixin from '../../mixins/ReaderNavigationMixin.vue';

export default {
  name: 'widget-passage-reference',
  mixins: [
    ReaderNavigationMixin,
  ],
  watch: {
    passage: {
      handler: 'setInputRef',
      immediate: true,
    },
  },
  computed: {
    passage() {
      return this.$store.getters['reader/passage'];
    },
  },
  data() {
    return {
      reference: '',
    };
  },
  methods: {
    setInputRef() {
      this.reference = this.passage.urn.reference;
    },
    handleKeyUp(e) {
      if (e.keyCode === 13) {
        this.$router.push(this.toRef(this.reference));
      } else {
        e.stopPropagation();
      }
    },
    handleClick(e) {
      const el = e.currentTarget;
      el.select();
    },
  },
};
</script>

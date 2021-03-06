<template>
  <div>
    <b-card v-if="inPreviewMode" class="mb-2">
      {{ messageForPreview }}
    </b-card>
    <div v-else>
      <div v-if="loading">
        <i class="fas fa-cog fa-spin text-muted"/>
        {{ $t('Loading...') }}
      </div>
      <div v-else>
        <template v-if="!loading && fileInfo">
          <b-btn v-show="!isReadOnly" class="mb-2 d-print-none" variant="primary" @click="onClick(fileInfo)">
            <i class="fas fa-file-download"/> {{ $t('Download') }}
          </b-btn>
          {{ fileInfo.file_name }}
        </template>
        <div v-else>
          {{ $t('No files available for download') }}
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import _ from  'lodash';

export default {
  inheritAttrs: false,
  data() {
    return {
      fileType: null,
      loading: true,
      fileInfo: null,
      requestId: null,
      collectionId: null,
      recordId: null,
      prefix: '',
    };
  },
  props: ['name', 'endpoint', 'requestFiles'],
  beforeMount() {
    this.getFileType();

    if (this.fileType == 'request') {
      this.getRequestId();
    }

    if (this.fileType == 'collection') {
      this.getCollectionInfo();
    }
  },
  mounted() {
    if (!this.fileType) {
      // Not somewhere we can download anything (like web entry start event)
      this.loading = false;
      return;
    }

    this.setPrefix();

    if (this.fileType == 'request') {
      this.getRequestFiles();
    }

    if (this.fileType == 'collection') {
      this.getCollectionFiles();
    }
  },
  computed: {
    inPreviewMode() {
      return this.mode === 'preview' && !window.exampleScreens;
    },
    messageForPreview() {
      return this.$t(
        'Download button for {{fileName}} will appear here.',
        { fileName: this.name }
      );
    },
    mode() {
      return this.$root.$children[0].mode;
    },
    isReadOnly() {
      return this.$attrs.readonly ? this.$attrs.readonly : false;
    },
  },
  methods: {
    onClick() {
      if (this.fileType == 'request') {
        this.downloadRequestFile();
      }

      if (this.fileType == 'collection') {
        this.downloadCollectionFile();
      }
    },
    requestEndpoint() {
      let endpoint = this.endpoint;

      if (_.has(window, 'PM4ConfigOverrides.getFileEndpoint')) {
        endpoint = window.PM4ConfigOverrides.getFileEndpoint;
      }

      if (endpoint && this.fileInfo) {
        const query = '?name=' + encodeURIComponent(this.prefix + this.name) + '&token=' + this.fileInfo.token;
        return endpoint + query;
      }

      return '/request/' + this.requestId + '/files/' + this.fileInfo.id;
    },
    setPrefix() {
      let parent = this.$parent;
      let i = 0;
      while (!parent.loopContext) {
        parent = parent.$parent;

        if (parent === this.$root) {
          parent = null;
          break;
        }

        i++;
        if (i > 100) {
          throw 'Loop Error';
        }
      }

      if (parent && parent.loopContext) {
        this.prefix = parent.loopContext + '.';
      }
    },
    downloadRequestFile() {
      window.ProcessMaker.apiClient({
        baseURL: '/',
        url: this.requestEndpoint(),
        method: 'GET',
        responseType: 'blob', // important
      }).then(response => {
        //axios needs to be told to open the file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', this.fileInfo.file_name);
        document.body.appendChild(link);
        link.click();
      });
    },
    downloadCollectionFile() {
      window.ProcessMaker.apiClient({
        url: '/files/' + this.fileInfo.id + '/contents',
        method: 'GET',
        responseType: 'blob', // important
      }).then(response => {
        //axios needs to be told to open the file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', this.fileInfo.file_name);
        document.body.appendChild(link);
        link.click();
      });
    },
    getFileType() {
      if (document.head.querySelector('meta[name="request-id"]')) {
        this.fileType = 'request';
      }

      if (document.head.querySelector('meta[name="collection-id"]')) {
        this.fileType = 'collection';
      }
    },
    getRequestId() {
      let node = document.head.querySelector('meta[name="request-id"]');
      if (node === null) {
        this.loading = false;
        return;
      }
      this.requestId = node.content;
    },
    getCollectionInfo() {
      let collectionNode = document.head.querySelector('meta[name="collection-id"]');
      if (collectionNode === null) {
        this.loading = false;
        return;
      }
      this.collectionId = collectionNode.content;

      let recordNode = document.head.querySelector('meta[name="record-id"]');
      if (recordNode === null) {
        this.loading = false;
        return;
      }
      this.recordId = recordNode.content;
    },
    getRequestFiles() {
      let requestFiles = this.requestFiles;

      if (_.has(window, 'PM4ConfigOverrides.requestFiles')) {
        requestFiles = window.PM4ConfigOverrides.requestFiles;
      }

      if (requestFiles && requestFiles[this.prefix + this.name]) {
        this.loading = false;
        this.fileInfo = requestFiles[this.prefix + this.name];
        return;
      }

      if (this.requestId === null) {
        this.loading = false;
        return;
      }
      window.ProcessMaker.apiClient
        .get('requests/' + this.requestId + '/files?name=' + this.prefix + this.name)
        .then(response => {
          this.fileInfo = _.get(response, 'data.data.0', null);
          this.loading = false;
        });
    },
    setFileInfoFromCache() {
      const info = _.get(window.ProcessMaker.CollectionData, this.prefix + this.name, null);
      if (info) {
        this.fileInfo = { ...info, file_name: info.name };
      }
    },
    getCollectionFiles() {
      if (this.collectionId === null || this.recordId === null) {
        this.loading = false;
        return;
      }

      window.ProcessMaker.EventBus.$on('got-collection-data', () => {
        this.setFileInfoFromCache();
        this.loading = false;
      });

      if (!window.ProcessMaker.CollectionData) {
        window.ProcessMaker.CollectionData = {};
        window.ProcessMaker.apiClient
          .get('collections/' + this.collectionId + '/records/' + this.recordId)
          .then(response => {
            window.ProcessMaker.CollectionData = response.data.data;
            window.ProcessMaker.EventBus.$emit('got-collection-data');
          });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
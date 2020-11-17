import { get, isEqual } from 'lodash';
import Mustache from 'mustache';
import { ValidationMsg } from './ValidationRules';

export default {
  props: {
    vdata: {
      type: Object,
      required: true,
    },
    _parent: null,
  },
  computed: {
    references__() {
      return this.$parent && this.$parent.references__;
    },
  },
  methods: {
    mustache(text) {
      try {
        return text && Mustache.render(text, this.vdata);
      } catch (e) {
        return 'MUSTACHE: ' + e.message;
      }
    },
    submitForm() {
      this.$emit('submit', this.vdata);
    },
    getValue(name, object = this) {
      return object ? get(object, name) : undefined;
    },
    setValue(name, value, object = this, defaults = object) {
      if (object && value !== undefined) {
        const splittedName = name.split('.');
        splittedName.forEach((attr, index) => {

          let isLastElement, setValue;
          const originalValue = get(object, attr);

          if (index === splittedName.length - 1) {
            isLastElement = true;
          } else {
            isLastElement = false;
          }

          if (isLastElement) {
            setValue = value;

          } else {
            setValue = originalValue;

            if (!setValue) {
              // Check defaults
              setValue = get(defaults, attr);
            }
            
            if (!setValue) {
              // Still no value? Set empty object
              setValue = {};
            }
          }

          if (isLastElement && isEqual(setValue, originalValue)) {
            return;
          }

          this.$set(
            object,
            attr,
            setValue
          );
          object = get(object, attr);
        });
      }
    },
    validationMessage(validation) {
      const message = [];
      Object.keys(ValidationMsg).forEach(key => {
        if (validation[key]!==undefined && !validation[key]) {
          message.push(this.$t(ValidationMsg[key]).replace(/\{(.+?)\}/g,(match,p1)=>{return validation.$params[key][p1];}));
        }
      });
      return message.join('.\n');
    },
  },
};

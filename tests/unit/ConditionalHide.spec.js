import {mount} from '@vue/test-utils';
import Renderer from '../../src/components/vue-form-renderer';

describe('Hide or show controls', () => {

  // Now mount the component and you have the wrapper
  const wrapper = mount(Renderer, {
    sync: false,
    propsData: {
      config: [{
        items: [
          {
            'config': {
              'label': 'Field test 1',
              'name': 'field1',
              'placeholder': '',
              'validation': '',
              'helper': null,
              'type': 'text',
            },
          },
          {
            'config': {
              'label': 'Field test 2',
              'name': 'field2',
              'placeholder': '',
              'validation': '',
              'helper': null,
              'type': 'text',
              'conditionalHide': 'field1=="field2"',
            },
          },
          {
            'config': {
              'label': 'Field test 3',
              'name': 'field3',
              'placeholder': '',
              'validation': '',
              'helper': null,
              'type': 'text',
              'conditionalHide': 'field1=="field3"',
            },
          },
          {
            'config': {
              'label': 'Field test 4',
              'name': 'field4',
              'placeholder': '',
              'validation': '',
              'helper': null,
              'type': 'text',
            },
          },

        ],
      }], data: {}, page: 0, computed: [],
    },
  });

  it('Hide control with evaluation success', () => {

    //The fields that not contain a conditional are displayed by default
    expect(wrapper.vm.showElement.field1).toBe(true);
    expect(wrapper.vm.showElement.field4).toBe(true);

    //The fields that contain a conditional and evaluation is false are hidden.
    expect(wrapper.vm.showElement.field2).toBe(false);
    expect(wrapper.vm.showElement.field3).toBe(false);

    //When changing the value, the condition is calculated automatically to verify if it is hidden or not
    wrapper.setData({'model': {'field1': 'field2'}});
    expect(wrapper.vm.showElement.field1).toBe(true); //visible
    expect(wrapper.vm.showElement.field2).toBe(true); //visible
    expect(wrapper.vm.showElement.field4).toBe(true); //visible
    expect(wrapper.vm.showElement.field3).toBe(false); //The field was hidden because it did not meet the condition.

    //When changing the value, the condition is calculated automatically to verify if it is hidden or not
    wrapper.setData({'model': {'field1': 'field3'}});
    expect(wrapper.vm.showElement.field1).toBe(true); //visible
    expect(wrapper.vm.showElement.field3).toBe(true); //visible
    expect(wrapper.vm.showElement.field4).toBe(true); //visible
    expect(wrapper.vm.showElement.field2).toBe(false); //The field was hidden because it did not meet the condition.
  });

  it('Not Hide control with evaluation failure', () => {

    //When changing the value, the condition is calculated automatically to verify if it is hidden or not
    wrapper.setData({'model': {'field1': ''}});
    expect(wrapper.vm.showElement.field1).toBe(true); //visible
    expect(wrapper.vm.showElement.field4).toBe(true); //visible
    expect(wrapper.vm.showElement.field2).toBe(false); //The field was hidden because it did not meet the condition.
    expect(wrapper.vm.showElement.field3).toBe(false); //The field was hidden because it did not meet the condition.

    //When changing the value, the condition is calculated automatically to verify if it is hidden or not
    wrapper.setData({'model': {'field1': 'other value'}});
    expect(wrapper.vm.showElement.field1).toBe(true); //visible
    expect(wrapper.vm.showElement.field4).toBe(true); //visible
    expect(wrapper.vm.showElement.field2).toBe(false); //The field was hidden because it did not meet the condition.
    expect(wrapper.vm.showElement.field3).toBe(false); //The field was hidden because it did not meet the condition.
  });

});

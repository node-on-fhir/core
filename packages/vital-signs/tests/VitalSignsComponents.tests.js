// packages/vital-signs/tests/VitalSignsComponents.tests.js

import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

// Import components to test
import VitalSignsTable from '../client/components/displays/VitalSignsTable';
import VitalSignsChart from '../client/components/displays/VitalSignsChart';
import VitalSignsPanel from '../client/components/panels/VitalSignsPanel';
import VitalSignForm from '../client/components/forms/VitalSignForm';

// Mock data
const mockVitalSigns = [{
  id: 'vital-1',
  resourceType: 'Observation',
  status: 'final',
  code: {
    coding: [{
      system: 'http://loinc.org',
      code: '8867-4',
      display: 'Heart rate'
    }],
    text: 'Heart rate'
  },
  subject: {
    reference: 'Patient/123',
    display: 'John Doe'
  },
  effectiveDateTime: '2024-01-15T10:30:00Z',
  valueQuantity: {
    value: 72,
    unit: 'beats/minute',
    system: 'http://unitsofmeasure.org',
    code: '/min'
  },
  performer: [{
    reference: 'Practitioner/456',
    display: 'Dr. Smith'
  }]
}, {
  id: 'vital-2',
  resourceType: 'Observation',
  status: 'final',
  code: {
    coding: [{
      system: 'http://loinc.org',
      code: '8310-5',
      display: 'Body temperature'
    }],
    text: 'Body temperature'
  },
  subject: {
    reference: 'Patient/123',
    display: 'John Doe'
  },
  effectiveDateTime: '2024-01-15T10:30:00Z',
  valueQuantity: {
    value: 98.6,
    unit: '°F',
    system: 'http://unitsofmeasure.org',
    code: '[degF]'
  }
}];

describe('VitalSignsComponents', function() {
  
  describe('VitalSignsTable', function() {
    it('should render without errors', function() {
      const wrapper = shallow(<VitalSignsTable vitalSigns={[]} />);
      expect(wrapper.exists()).to.be.true;
    });
    
    it('should display empty message when no vital signs', function() {
      const wrapper = mount(<VitalSignsTable vitalSigns={[]} />);
      expect(wrapper.text()).to.include('No vital signs to display');
    });
    
    it('should render vital signs data', function() {
      const wrapper = mount(<VitalSignsTable vitalSigns={mockVitalSigns} />);
      
      // Check that vital sign types are displayed
      expect(wrapper.text()).to.include('Heart rate');
      expect(wrapper.text()).to.include('Body temperature');
      
      // Check that values are displayed
      expect(wrapper.text()).to.include('72');
      expect(wrapper.text()).to.include('98.6');
      
      // Check that units are displayed
      expect(wrapper.text()).to.include('beats/minute');
      expect(wrapper.text()).to.include('°F');
    });
    
    it('should handle row click events', function() {
      const onRowClick = sinon.spy();
      const wrapper = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns} 
          onRowClick={onRowClick}
        />
      );
      
      // Click on the first row
      wrapper.find('TableRow').at(2).simulate('click'); // Skip header row and get first data row
      
      expect(onRowClick.calledOnce).to.be.true;
      expect(onRowClick.firstCall.args[0]).to.equal('vital-1');
    });
    
    it('should handle remove record events', function() {
      const onRemoveRecord = sinon.spy();
      const wrapper = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns} 
          onRemoveRecord={onRemoveRecord}
          hideActionIcons={false}
        />
      );
      
      // Click delete button
      wrapper.find('IconButton').find({ title: 'Delete' }).first().simulate('click');
      
      expect(onRemoveRecord.calledOnce).to.be.true;
      expect(onRemoveRecord.firstCall.args[0]).to.equal('vital-1');
    });
    
    it('should respect hide column props', function() {
      const wrapper = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns}
          hideType={true}
          hideValue={true}
          hidePatient={true}
        />
      );
      
      // Check that hidden columns are not rendered
      const headers = wrapper.find('TableCell');
      const headerTexts = headers.map(cell => cell.text());
      
      expect(headerTexts).to.not.include('Type');
      expect(headerTexts).to.not.include('Value');
      expect(headerTexts).to.not.include('Patient');
    });
    
    it('should handle pagination', function() {
      const onSetPage = sinon.spy();
      const manyVitalSigns = Array.from({ length: 15 }, (_, i) => ({
        ...mockVitalSigns[0],
        id: `vital-${i}`,
        valueQuantity: { ...mockVitalSigns[0].valueQuantity, value: 70 + i }
      }));
      
      const wrapper = mount(
        <VitalSignsTable 
          vitalSigns={manyVitalSigns}
          onSetPage={onSetPage}
          page={0}
          rowsPerPage={5}
          count={15}
        />
      );
      
      // Find pagination component
      const pagination = wrapper.find('TablePagination');
      expect(pagination.exists()).to.be.true;
      
      // Simulate page change
      pagination.prop('onPageChange')(null, 1);
      
      expect(onSetPage.calledOnce).to.be.true;
      expect(onSetPage.firstCall.args[0]).to.equal(1);
    });
    
    it('should format dates according to dateFormat prop', function() {
      const wrapper = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns}
          dateFormat="MM/DD/YYYY"
        />
      );
      
      expect(wrapper.text()).to.include('01/15/2024');
    });
    
    it('should adapt layout for different form factors', function() {
      const wrapperPhone = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns}
          formFactorLayout="phone"
        />
      );
      
      // Phone layout should hide many columns
      const phoneHeaders = wrapperPhone.find('TableHead TableCell');
      expect(phoneHeaders.length).to.be.below(5);
      
      const wrapperDesktop = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns}
          formFactorLayout="desktop"
        />
      );
      
      // Desktop layout should show more columns
      const desktopHeaders = wrapperDesktop.find('TableHead TableCell');
      expect(desktopHeaders.length).to.be.above(phoneHeaders.length);
    });
    
    it('should display status as colored chip', function() {
      const wrapper = mount(
        <VitalSignsTable 
          vitalSigns={mockVitalSigns}
          hideStatus={false}
        />
      );
      
      const statusChips = wrapper.find('Chip');
      expect(statusChips.length).to.be.above(0);
      
      // Check that 'final' status has success color
      const finalChip = statusChips.filterWhere(chip => chip.prop('label') === 'final');
      expect(finalChip.prop('color')).to.equal('success');
    });
  });
  
  describe('VitalSignForm', function() {
    it('should render without errors', function() {
      const wrapper = shallow(<VitalSignForm />);
      expect(wrapper.exists()).to.be.true;
    });
    
    it('should display all vital sign input fields', function() {
      const wrapper = mount(<VitalSignForm />);
      
      // Check for common vital sign fields
      expect(wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Heart Rate')
      ).exists()).to.be.true;
      
      expect(wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Temperature')
      ).exists()).to.be.true;
      
      expect(wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Blood Pressure')
      ).exists()).to.be.true;
    });
    
    it('should validate input values', function() {
      const wrapper = mount(<VitalSignForm />);
      
      // Find heart rate input
      const heartRateInput = wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Heart Rate')
      ).first();
      
      // Simulate entering invalid value
      heartRateInput.find('input').simulate('change', { target: { value: '-10' } });
      
      // Should show error
      wrapper.update();
      expect(wrapper.find('.MuiFormHelperText-root.Mui-error').exists()).to.be.true;
    });
    
    it('should handle form submission', function() {
      const onSubmit = sinon.spy();
      const wrapper = mount(<VitalSignForm onSubmit={onSubmit} />);
      
      // Fill in some values
      const heartRateInput = wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Heart Rate')
      ).first();
      heartRateInput.find('input').simulate('change', { target: { value: '72' } });
      
      // Submit form
      wrapper.find('form').simulate('submit');
      
      expect(onSubmit.calledOnce).to.be.true;
      expect(onSubmit.firstCall.args[0]).to.have.property('heartRate', 72);
    });
    
    it('should handle unit selection', function() {
      const wrapper = mount(<VitalSignForm />);
      
      // Find temperature unit selector
      const tempUnitSelect = wrapper.find('Select').filterWhere(select => 
        select.prop('label') && select.prop('label').includes('Temperature Unit')
      ).first();
      
      expect(tempUnitSelect.exists()).to.be.true;
      
      // Should have Celsius and Fahrenheit options
      tempUnitSelect.simulate('click');
      const menuItems = wrapper.find('MenuItem');
      const menuTexts = menuItems.map(item => item.text());
      
      expect(menuTexts).to.include('Celsius');
      expect(menuTexts).to.include('Fahrenheit');
    });
    
    it('should pre-populate with existing vital sign data', function() {
      const existingVitalSign = {
        heartRate: 75,
        temperature: 98.6,
        temperatureUnit: 'fahrenheit',
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80
      };
      
      const wrapper = mount(<VitalSignForm vitalSign={existingVitalSign} />);
      
      // Check that values are populated
      const heartRateInput = wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Heart Rate')
      ).first();
      
      expect(heartRateInput.prop('value')).to.equal(75);
    });
    
    it('should handle clear/reset functionality', function() {
      const wrapper = mount(<VitalSignForm />);
      
      // Fill in some values
      const heartRateInput = wrapper.find('TextField').filterWhere(field => 
        field.prop('label') && field.prop('label').includes('Heart Rate')
      ).first();
      heartRateInput.find('input').simulate('change', { target: { value: '72' } });
      
      // Find and click reset button
      const resetButton = wrapper.find('Button').filterWhere(button => 
        button.text().includes('Clear') || button.text().includes('Reset')
      ).first();
      
      if (resetButton.exists()) {
        resetButton.simulate('click');
        
        // Check that form is cleared
        wrapper.update();
        expect(heartRateInput.prop('value')).to.equal('');
      }
    });
  });
  
  describe('VitalSignsPanel', function() {
    it('should render without errors', function() {
      const wrapper = shallow(<VitalSignsPanel vitalSigns={[]} />);
      expect(wrapper.exists()).to.be.true;
    });
    
    it('should display vital signs summary', function() {
      const wrapper = mount(<VitalSignsPanel vitalSigns={mockVitalSigns} />);
      
      // Should show latest vital signs
      expect(wrapper.text()).to.include('72');
      expect(wrapper.text()).to.include('beats/minute');
      expect(wrapper.text()).to.include('98.6');
      expect(wrapper.text()).to.include('°F');
    });
    
    it('should group vital signs by type', function() {
      const multipleReadings = [
        ...mockVitalSigns,
        {
          ...mockVitalSigns[0],
          id: 'vital-3',
          effectiveDateTime: '2024-01-14T10:30:00Z',
          valueQuantity: { ...mockVitalSigns[0].valueQuantity, value: 68 }
        }
      ];
      
      const wrapper = mount(<VitalSignsPanel vitalSigns={multipleReadings} />);
      
      // Should show both heart rate readings
      expect(wrapper.text()).to.include('72');
      expect(wrapper.text()).to.include('68');
    });
    
    it('should handle add new vital sign action', function() {
      const onAddVitalSign = sinon.spy();
      const wrapper = mount(
        <VitalSignsPanel 
          vitalSigns={mockVitalSigns}
          onAddVitalSign={onAddVitalSign}
        />
      );
      
      // Find and click add button
      const addButton = wrapper.find('Button').filterWhere(button => 
        button.text().includes('Add') || button.find('AddIcon').exists()
      ).first();
      
      if (addButton.exists()) {
        addButton.simulate('click');
        expect(onAddVitalSign.calledOnce).to.be.true;
      }
    });
    
    it('should display trend indicators', function() {
      const trendingVitalSigns = [
        {
          ...mockVitalSigns[0],
          id: 'vital-current',
          effectiveDateTime: '2024-01-15T10:30:00Z',
          valueQuantity: { ...mockVitalSigns[0].valueQuantity, value: 85 }
        },
        {
          ...mockVitalSigns[0],
          id: 'vital-previous',
          effectiveDateTime: '2024-01-14T10:30:00Z',
          valueQuantity: { ...mockVitalSigns[0].valueQuantity, value: 72 }
        }
      ];
      
      const wrapper = mount(<VitalSignsPanel vitalSigns={trendingVitalSigns} />);
      
      // Should show trend indicator (up arrow or similar)
      const trendIcons = wrapper.find('TrendingUpIcon').length + 
                        wrapper.find('TrendingDownIcon').length;
      expect(trendIcons).to.be.above(0);
    });
  });
  
  describe('VitalSignsChart', function() {
    it('should render without errors', function() {
      const wrapper = shallow(<VitalSignsChart vitalSigns={[]} />);
      expect(wrapper.exists()).to.be.true;
    });
    
    it('should display message when insufficient data', function() {
      const wrapper = mount(<VitalSignsChart vitalSigns={[mockVitalSigns[0]]} />);
      expect(wrapper.text()).to.include('Insufficient data') || 
             expect(wrapper.text()).to.include('Not enough data');
    });
    
    it('should render chart with multiple data points', function() {
      const chartData = Array.from({ length: 10 }, (_, i) => ({
        ...mockVitalSigns[0],
        id: `vital-${i}`,
        effectiveDateTime: new Date(2024, 0, i + 1).toISOString(),
        valueQuantity: { ...mockVitalSigns[0].valueQuantity, value: 70 + Math.random() * 10 }
      }));
      
      const wrapper = mount(<VitalSignsChart vitalSigns={chartData} />);
      
      // Check for chart elements (depends on charting library used)
      expect(wrapper.find('svg').exists() || wrapper.find('canvas').exists()).to.be.true;
    });
    
    it('should handle vital sign type selection', function() {
      const multiTypeData = [
        ...mockVitalSigns,
        {
          ...mockVitalSigns[0],
          id: 'vital-bp',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '85354-9',
              display: 'Blood pressure panel'
            }],
            text: 'Blood pressure'
          },
          component: [{
            code: { coding: [{ code: '8480-6' }] },
            valueQuantity: { value: 120, unit: 'mmHg' }
          }, {
            code: { coding: [{ code: '8462-4' }] },
            valueQuantity: { value: 80, unit: 'mmHg' }
          }]
        }
      ];
      
      const wrapper = mount(<VitalSignsChart vitalSigns={multiTypeData} />);
      
      // Should have type selector
      const typeSelector = wrapper.find('Select').filterWhere(select => 
        select.prop('label') && select.prop('label').includes('Vital Sign Type')
      );
      
      expect(typeSelector.exists()).to.be.true;
    });
    
    it('should handle date range selection', function() {
      const onDateRangeChange = sinon.spy();
      const wrapper = mount(
        <VitalSignsChart 
          vitalSigns={mockVitalSigns}
          onDateRangeChange={onDateRangeChange}
        />
      );
      
      // Find date range controls
      const dateControls = wrapper.find('DatePicker') || wrapper.find('TextField[type="date"]');
      
      if (dateControls.exists()) {
        // Simulate date change
        dateControls.first().prop('onChange')(new Date(2024, 0, 1));
        expect(onDateRangeChange.called).to.be.true;
      }
    });
  });
});
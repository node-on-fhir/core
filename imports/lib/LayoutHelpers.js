import React from 'react';

import { get, has } from 'lodash';
import { Session } from 'meteor/session';

import { Icon } from 'react-icons-kit'
import {ic_filter_1} from 'react-icons-kit/md/ic_filter_1'
import {ic_filter_2} from 'react-icons-kit/md/ic_filter_2'

export const LayoutHelpers = {
  calcCanvasPaddingWidth: function(){
    let paddingWidth = get(Meteor, 'settings.public.defaults.defaultPagePadding', 0);

    if(get(Meteor, 'settings.public.defaults.sidebar.minibarVisible', false)){
      paddingWidth = 20;

      if(Meteor.isCordova){
        paddingWidth = 20;
      }
      if(window.innerWidth > 768){
        paddingWidth = 104;
      }
  
    }
    return paddingWidth;
  },
  determineFormFactor: function(numColumns, totalMargins){
    if(!numColumns){
      numColumns = 1;
    }
    if(!totalMargins){
      totalMargins = 200;
    }

    let formFactor = "phone";
    let calculatedInnerWidth = ((window.innerWidth - totalMargins) / numColumns).toFixed(0);

    if(calculatedInnerWidth >= 768){
      formFactor = "tablet";
    } 
    if(calculatedInnerWidth >= 1200){
      formFactor = "desktop";
    } 
    if(calculatedInnerWidth >= 1920){
      formFactor = "hdmi";
    } 
    if(calculatedInnerWidth >= 4000){
      formFactor = "videowall";
    }

    return formFactor;
  },
  calcCardRowHeight: function(numberOfRows, rowSpacing){
    let cardRowHeight = 0;
    let fractionalRowHeight = 1;
    let innerCanvasHeight = 0;  

    let headerHeight = footerHeight = 64;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
      headerHeight = 128;
    }

    if(!rowSpacing){
      rowSpacing = 20;
    }

    if(numberOfRows > 0){
      fractionalRowHeight = 1 / numberOfRows;

      if(window.innerHeight > 0){
        innerCanvasHeight = LayoutHelpers.calcInnerCanvasHeight();

        cardRowHeight = ((innerCanvasHeight - ((numberOfRows + 1) * rowSpacing)) * fractionalRowHeight).toFixed(0);
      }       
    }
    return cardRowHeight;
  },
  calcCardRowContentHeight: function(numberOfRows, cardHeaderHeight, rowSpacing){    
    if(!cardHeaderHeight){
      cardHeaderHeight = 0;
    }
    if(!numberOfRows){
      numberOfRows = 1;
    }
    if(!rowSpacing){
      rowSpacing = 20;
    }
    let cardRowContentHeight = LayoutHelpers.calcCardRowHeight(numberOfRows, rowSpacing) - cardHeaderHeight;
    return cardRowContentHeight;
  },
  calcCardContentHeight: function(cardHeight){
    if(cardHeight > 40){
      return cardHeight - 40;
    }
  },
  calcHeaderHeight: function(){
    let headerHeight = 64;
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
      headerHeight = 128;
    }
    return headerHeight;
  },
  calcInnerCanvasHeight: function(headerHeight, footerHeight, innerHeight){
    if(!headerHeight){
      headerHeight = 64;
    }
    if(get(Meteor, 'settings.public.defaults.prominentHeader')){
      headerHeight = 128;
    }
    if(!footerHeight){
      footerHeight = 64;
    }

    if(!innerHeight){
      innerHeight = window.innerHeight;
    }
    
    let canvasHeight = 0;
    if(Meteor.isClient){
      canvasHeight = innerHeight - headerHeight - footerHeight;
    }

    // Should we also include the Meteor.isServer case?
    // How would this work as server-side rendering?  

    return canvasHeight;
  },
  calcTableRows: function(tableSize, innerHeight){
    let rowHeight = 52;
    if(tableSize === "small"){
      rowHeight = 33;
    }

    let innerCanvasHeight = LayoutHelpers.calcInnerCanvasHeight(null, null, innerHeight);
    
    // Card header in the page (e.g., "Conditions" title)
    let cardHeaderHeight = 64;
    
    // Additional space used when a patient is selected and prominentHeader is enabled
    let selectedPatientHeaderSpace = 0;
    if(get(Meteor, 'settings.public.defaults.prominentHeader') && (Session.get('selectedPatientId') || Session.get('selectedPatient'))){
      // The prominent header is already accounted for in calcInnerCanvasHeight
      // But we need to account for any additional spacing or elements
      selectedPatientHeaderSpace = 20; // Additional margin when patient is selected
    }

    let cardMargin = 20;
    let tableMargins = 60;
    let paginationHeight = 52; // Space for pagination controls
    let tableHeight = innerCanvasHeight - cardMargin - cardHeaderHeight - tableMargins - paginationHeight - selectedPatientHeaderSpace;
    
    let numberOfRows = Number((tableHeight / rowHeight).toFixed(0));

    // Reduce by 1 to account for rounding and ensure content fits
    numberOfRows = numberOfRows - 1;

    // Ensure we have at least 5 rows
    if(numberOfRows < 5){
      numberOfRows = 5;
    }

    return numberOfRows;
  },
  getCardLayoutIcon: function(onePageLayout){
    let layoutIcon;
    if(onePageLayout){
      layoutIcon = <Icon icon={ic_filter_1}/> 
    } else {
      layoutIcon = <Icon icon={ic_filter_2}/> 
    }  
    return layoutIcon;
  }
}

export default LayoutHelpers;





// TODO: Generalize the following code snippet, and determine an API
// that can be used across all the different resource types
// We want to be able to sort all columns in the other tables.
// However, they've now been converted to React pure components
// meaning they don't manage their own sorting now.
// That's now the responsibility if the containing Page object
// But it may give us the opportunity to add in column filter preferences

// LayoutHelpers.generateSortQuery()
// LayoutHelpers.sortAscending()
// LayoutHelpers.sort Descending()

// let options = {
//   sort: {}
// }

// if(props.sort){
//   if(Session.get('sortAscending')){
//     options.sort[this.props.sort] = 1;
//   } else {
//     options.sort[this.props.sort] = -1;
//   }
// } else {
//   // but we default to the date the questionnaire was authored on by default
//   options.sort = {};
//   if(Session.get('sortAscending')){
//     options.sort["authored"] = 1;
//   } else {
//     options.sort["authored"] = -1;
//   }
// }
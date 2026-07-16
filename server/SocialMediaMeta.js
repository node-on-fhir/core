// server/SocialMediaMeta.js
//
// Settings-gated social media head injection (Open Graph + Twitter cards)
// plus favicon links. Social crawlers (Facebook, X, LinkedIn, iMessage,
// Slack) don't execute JavaScript, so link previews require these tags in
// the server-delivered boilerplate HTML — client-side Helmet
// (imports/ui/App.jsx) is not enough. Favicons ride the same mechanism
// because browsers request them before the client bundle runs.
//
// Independently gated on Meteor.settings.public.socialmedia and
// Meteor.settings.public.favicon: absent block → no injection
// (desktop/mobile/other platform builds stay untouched).

import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import { get } from 'lodash';

import LoggerModule from '/imports/lib/Logger.js';
const log = LoggerModule.Logger.for('SocialMediaMeta');

function escapeHtmlAttribute(value){
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Relative paths in settings (e.g. "/workflows/homepage/card.jpg") resolve
// against ROOT_URL, so a domain migration only has to change ROOT_URL.
function absolutize(value){
  if(value && value.startsWith('/')){
    return Meteor.absoluteUrl(value.replace(/^\//, ''));
  }
  return value;
}

// Favicon links from Meteor.settings.public.favicon. Hrefs stay relative
// (unlike Open Graph, which crawlers require absolute) so the tags survive
// domain changes without touching ROOT_URL. PNG-only is fine for modern
// browsers; `ico` is optional legacy support.
function buildFaviconTags(favicon){
  const tags = [];

  const ico = get(favicon, 'ico', '');
  if(ico){
    tags.push('<link rel="icon" href="' + escapeHtmlAttribute(ico) + '" sizes="any" />');
  } else {
    log.debug('Skipping favicon link - no ico configured');
  }

  const png32 = get(favicon, 'png32', '');
  if(png32){
    tags.push('<link rel="icon" type="image/png" sizes="32x32" href="' + escapeHtmlAttribute(png32) + '" />');
  } else {
    log.debug('Skipping favicon link - no png32 configured');
  }

  const png192 = get(favicon, 'png192', '');
  if(png192){
    tags.push('<link rel="icon" type="image/png" sizes="192x192" href="' + escapeHtmlAttribute(png192) + '" />');
  } else {
    log.debug('Skipping favicon link - no png192 configured');
  }

  const appleTouchIcon = get(favicon, 'appleTouchIcon', '');
  if(appleTouchIcon){
    tags.push('<link rel="apple-touch-icon" sizes="180x180" href="' + escapeHtmlAttribute(appleTouchIcon) + '" />');
  } else {
    log.debug('Skipping favicon link - no appleTouchIcon configured');
  }

  return tags;
}

function buildSocialMediaTags(socialmedia){
  const url = absolutize(get(socialmedia, 'url', ''));
  const image = absolutize(get(socialmedia, 'image', ''));
  const description = get(socialmedia, 'description', '');

  const tags = [];

  if(url){
    tags.push('<link rel="canonical" href="' + escapeHtmlAttribute(url) + '" />');
  }
  if(description){
    tags.push('<meta name="description" content="' + escapeHtmlAttribute(description) + '" />');
  }

  const openGraphTags = {
    'og:title': get(socialmedia, 'title', ''),
    'og:type': get(socialmedia, 'type', ''),
    'og:url': url,
    'og:image': image,
    // width/height let Facebook render the full-size card on the very first
    // share, before its crawler has fetched the image (1200x630 = 1.91:1,
    // the shared FB/LinkedIn ratio; X crops it to 2:1 by a 15px sliver)
    'og:image:width': get(socialmedia, 'imageWidth', ''),
    'og:image:height': get(socialmedia, 'imageHeight', ''),
    'og:image:alt': get(socialmedia, 'imageAlt', ''),
    'og:description': description,
    'og:site_name': get(socialmedia, 'site_name', ''),
    'og:author': get(socialmedia, 'author', '')
  };
  Object.keys(openGraphTags).forEach(function(property){
    if(openGraphTags[property]){
      tags.push('<meta property="' + property + '" content="' + escapeHtmlAttribute(openGraphTags[property]) + '" />');
    } else {
      log.debug('Skipping empty Open Graph tag', { property: property });
    }
  });

  const twitterTags = {
    'twitter:card': 'summary_large_image',
    'twitter:title': get(socialmedia, 'title', ''),
    'twitter:description': description,
    'twitter:image': image
  };
  Object.keys(twitterTags).forEach(function(name){
    if(twitterTags[name]){
      tags.push('<meta name="' + name + '" content="' + escapeHtmlAttribute(twitterTags[name]) + '" />');
    } else {
      log.debug('Skipping empty Twitter tag', { name: name });
    }
  });

  log.info('Social media head injection enabled', { tagCount: tags.length, url: url, image: image });
  return tags;
}

Meteor.startup(function(){
  let tags = [];

  const socialmedia = get(Meteor, 'settings.public.socialmedia');
  if(socialmedia){
    tags = tags.concat(buildSocialMediaTags(socialmedia));
  } else {
    log.info('Social media head injection disabled - no Meteor.settings.public.socialmedia block');
  }

  const favicon = get(Meteor, 'settings.public.favicon');
  if(favicon){
    const faviconTags = buildFaviconTags(favicon);
    tags = tags.concat(faviconTags);
    log.info('Favicon head injection enabled', { tagCount: faviconTags.length });
  } else {
    log.info('Favicon head injection disabled - no Meteor.settings.public.favicon block');
  }

  if(tags.length === 0){
    log.info('No head tags to inject - skipping boilerplate callback registration');
    return;
  }

  const tagsHtml = tags.join('\n    ');

  WebAppInternals.registerBoilerplateDataCallback('socialmedia-meta', function(request, data){
    data.dynamicHead = (data.dynamicHead || '') + tagsHtml;
  });
});

// npmPackages/fhircast-module/client/hooks/useFhircastWebSocket.js

import { useState, useRef, useEffect } from 'react';
import { Random } from 'meteor/random';
import { WebSocketStatus } from '../lib/types.js';

// =============================================================================
// useWebSocket - Low-level WebSocket connection hook
// =============================================================================

export function useWebSocket({ url, onMessage, onOpen, onClose }) {
  const wsRef = useRef();
  const [status, setStatus] = useState(WebSocketStatus.Closed);

  function call(cb) {
    if (cb) {
      var args = Array.prototype.slice.call(arguments, 1);
      cb.apply(null, args);
    }
  }

  function open() {
    if (wsRef.current) {
      close();
    }

    console.log('[useWebSocket] Opening:', url);
    setStatus(WebSocketStatus.Opening);

    wsRef.current = new WebSocket(url);
    console.log('[fhircast-ws] Connecting to:', url);
    wsRef.current.onopen = function(e) {
      console.log('[fhircast-ws] Connection opened');
      setStatus(WebSocketStatus.Open);
      call(onOpen, e);
    };
    wsRef.current.onmessage = function(e) {
      call(onMessage, e);
    };
    wsRef.current.onclose = function(e) {
      console.log('[useWebSocket] Closed, code:', e.code, 'reason:', e.reason);
      close();
    };
  }

  function close() {
    console.log('[fhircast-ws] Connection closing');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus(WebSocketStatus.Closed);
    call(onClose);
  }

  function send(message) {
    if (!wsRef.current) {
      return;
    }

    wsRef.current.send(message);
  }

  return { status: status, open: open, close: close, send: send };
}

// =============================================================================
// useFhircastWebSocket - FHIRcast-specific WebSocket hook
// =============================================================================

export function useFhircastWebSocket({ url, endpoint, connect, onBind, onUnbind, onEvent }) {
  const [isBound, setIsBound] = useState(false);

  function handleMessage(e) {
    var data = JSON.parse(e.data);
    console.log('[fhircast-ws] Message received:', data.bound ? '{bound:true}' : 'event');

    if (data.bound) {
      setIsBound(true);
      if (onBind) {
        onBind(endpoint);
      }
      return;
    }

    if (onEvent) {
      onEvent(data);
    }
  }

  var ws = useWebSocket({
    url: url + '/' + endpoint,
    onMessage: function(e) { handleMessage(e); },
    onClose: onUnbind
  });

  var status = ws.status;
  var open = ws.open;
  var close = ws.close;
  var send = ws.send;

  useEffect(function() {
    if (connect) {
      open();
    } else {
      doClose();
    }

    return function() { doClose(); };
  }, [url, endpoint, connect]);

  function doClose() {
    setIsBound(false);
    close();

    if (onUnbind) {
      onUnbind();
    }
  }

  function publishEvent(evt, id) {
    var msg = {
      timestamp: new Date().toJSON(),
      id: id || Random.id(),
      event: evt
    };
    send(JSON.stringify(msg));
  }

  return { status: status, isBound: isBound, publishEvent: publishEvent };
}

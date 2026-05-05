// imports/components/CrudExtensions.jsx

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { get } from 'lodash';

function resolveExtensionValue(ext) {
  if (get(ext, 'valueString')) return get(ext, 'valueString');
  if (get(ext, 'valueInteger') !== undefined) return String(get(ext, 'valueInteger'));
  if (get(ext, 'valueDecimal') !== undefined) return String(get(ext, 'valueDecimal'));
  if (get(ext, 'valueBoolean') !== undefined) return String(get(ext, 'valueBoolean'));
  if (get(ext, 'valueDate')) return get(ext, 'valueDate');
  if (get(ext, 'valueDateTime')) return get(ext, 'valueDateTime');
  if (get(ext, 'valueReference.display')) return get(ext, 'valueReference.display');
  if (get(ext, 'valueReference.reference')) return get(ext, 'valueReference.reference');
  if (get(ext, 'valueQuantity.value') !== undefined) {
    return get(ext, 'valueQuantity.value') + ' ' + get(ext, 'valueQuantity.unit', '');
  }
  if (get(ext, 'valueCoding.display')) return get(ext, 'valueCoding.display');
  if (get(ext, 'valueCoding.code')) return get(ext, 'valueCoding.code');
  if (Array.isArray(get(ext, 'extension')) && ext.extension.length > 0) {
    return ext.extension.length + ' sub-extension' + (ext.extension.length !== 1 ? 's' : '');
  }
  return '';
}

function CrudExtensions({ extensions }) {
  if (!Array.isArray(extensions) || extensions.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
        Extensions
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {extensions.map(function(ext, idx) {
          var url = get(ext, 'url', '');
          var shortUrl = url.split('/').pop() || url;
          var value = resolveExtensionValue(ext);
          var hasSubExtensions = Array.isArray(get(ext, 'extension')) && ext.extension.length > 0;

          return (
            <Box key={idx}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'action.hover'
              }}>
                <Chip
                  label={shortUrl}
                  size="small"
                  sx={{ fontSize: '0.7rem', height: 20, flexShrink: 0 }}
                />
                <Typography variant="body2" sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {value}
                </Typography>
              </Box>
              {hasSubExtensions && (
                <Box sx={{ ml: 3, mt: 0.5 }}>
                  {ext.extension.map(function(subExt, subIdx) {
                    var subUrl = get(subExt, 'url', '').split('/').pop() || get(subExt, 'url', '');
                    var subValue = resolveExtensionValue(subExt);

                    return (
                      <Box key={subIdx} sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 0.5,
                        borderRadius: 1
                      }}>
                        <Chip
                          label={subUrl}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {subValue}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default CrudExtensions;

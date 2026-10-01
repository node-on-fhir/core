// imports/accounts/client/pages/LoginPage.jsx

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, useMediaQuery } from '@mui/material';
import { LoginForm } from '../components/LoginForm';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { sanitizeReturnPath, appendReturnTo } = WorkflowNavigation;

// Card placement over the router area. ?align=left|center|right centers the card
// horizontally (⅙ / ½ / ⅚ of the width). ?valign=top|center|bottom sets the
// card's TOP EDGE on a fixed line and lets it grow DOWNWARD, so the tabs and
// inputs hold their position when the form gets taller (inline error, alert box,
// changed button) — only the area below expands. That's what keeps the inputs
// from jumping between steps.
//
// The line is a fixed % — never a height-dependent transform, which is what was
// redrawing the inputs. `bottom` sits at 50%: the card floats in the lower half
// with roughly the bottom ~20% of the window left open beneath a typical card,
// then grows down into that space (raise the % to hug lower, lower it to float
// higher). top/center sit near the top of their regions.
//
// Absolute, not grid: a 1fr grid row balloons to fit a tall card and reflows the
// page. Vertical is a fixed top edge (no Y translate); horizontal is centered.
const ALIGN_X = { left: '16.67%', center: '50%', right: '83.34%' };
const VALIGN_Y = { top: '0%', center: '33.34%', bottom: '50%' };

function resolvePlacement(value, map) {
  const key = String(value || '').toLowerCase();
  return map[key] || map.center;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route preservation: AuthGuard/NoAuthorizationPage thread the blocked
  // route here as ?returnTo=<encoded internal path>. searchParams.get()
  // already decoded once — sanitize the decoded value (internal paths only;
  // invalid/absent falls back to the home route).
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));

  // Placement anchor points (default to dead-center when absent/invalid).
  const leftPct = resolvePlacement(searchParams.get('align'), ALIGN_X);
  const topPct = resolvePlacement(searchParams.get('valign'), VALIGN_Y);

  const handleSuccess = function() {
    // Redirect to the originally requested page after successful login,
    // or home when none was preserved
    navigate(returnTo || '/');
  };

  const handleSignupClick = function() {
    // Forward returnTo so the route survives a signin <-> signup bounce
    navigate(appendReturnTo('/register', returnTo));
  };

  const handleForgotPasswordClick = function() {
    // returnTo intentionally NOT forwarded: the reset flow round-trips
    // through email -> /reset-password/:token, so the param is lost anyway
    navigate('/forgot-password');
  };

  const formEl = (
    <LoginForm
      onSuccess={handleSuccess}
      onSignupClick={handleSignupClick}
      onForgotPasswordClick={handleForgotPasswordClick}
    />
  );

  // The absolute align/valign placement is a big-desktop affordance. On a short
  // OR narrow viewport a bottom/right-anchored tall card runs off-screen (the
  // error state especially) — so we gate on BOTH width and height (valign=bottom
  // is fundamentally a height problem) and, below the threshold, fall back to a
  // plain centered card. align/valign are intentionally ignored when compact.
  const roomy = useMediaQuery('(min-width:1200px) and (min-height:900px)');

  // Compact / mobile: centered and scroll-safe. The minHeight:100% flex wrapper
  // (rather than height:100% + justifyContent) avoids the classic flex-centering
  // clip — when the card is taller than the viewport the wrapper grows and the
  // outer box scrolls, keeping the top of the card reachable.
  if (!roomy) {
    return (
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <Box sx={{
          minHeight: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', p: 2
        }}>
          <Box sx={{ width: 'min(440px, calc(100vw - 32px))' }}>
            {formEl}
          </Box>
        </Box>
      </Box>
    );
  }

  // Roomy desktop: absolute placement on the (leftPct, topPct) anchor — top-
  // anchored vertically (grows downward, no reflow), center-anchored
  // horizontally (translateX -50%). No page-level bgcolor: StyledMainRouter
  // paints background.default + the ambiance image (rules/ui/layout-patterns.md).
  return (
    <Box sx={{ position: 'relative', height: '100%', overflow: 'auto', p: 2 }}>
      <Box
        sx={{
          position: 'absolute',
          top: topPct,
          left: leftPct,
          transform: 'translateX(-50%)',
          width: 'min(440px, calc(100vw - 32px))'
        }}
      >
        {formEl}
      </Box>
    </Box>
  );
}

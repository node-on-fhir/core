// imports/ui/DICOM/hooks/useTools.js
// Hook to manage Cornerstone3D Tools

import { useEffect, useCallback } from 'react';

/**
 * Hook to manage Cornerstone3D Tools
 */
export function useTools(viewportId, renderingEngine) {
  const toolGroupId = 'DICOM_TOOL_GROUP';

  /**
   * Initialize tools
   */
  useEffect(function() {
    if (!renderingEngine || !viewportId) return;
    if (!window.cornerstone3DTools) return;

    console.log('🔧 Initializing Cornerstone3D Tools...');

    const cornerstone3DTools = window.cornerstone3DTools;

    const {
      WindowLevelTool,
      PanTool,
      ZoomTool,
      StackScrollMouseWheelTool,
      LengthTool,
      ToolGroupManager,
      Enums: csToolsEnums,
    } = cornerstone3DTools;

    try {
      // Add tools to Cornerstone3D
      cornerstone3DTools.addTool(WindowLevelTool);
      cornerstone3DTools.addTool(PanTool);
      cornerstone3DTools.addTool(ZoomTool);
      cornerstone3DTools.addTool(StackScrollMouseWheelTool);
      cornerstone3DTools.addTool(LengthTool);

      // Create or get tool group
      let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

      if (!toolGroup) {
        toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      }

      // Add tools to tool group
      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(StackScrollMouseWheelTool.toolName);
      toolGroup.addTool(LengthTool.toolName);

      // Set initial active tool (Window/Level)
      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }], // Left click
      });

      // Enable stack scroll with mouse wheel
      toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

      // Set other tools as passive (can be activated)
      toolGroup.setToolPassive(PanTool.toolName);
      toolGroup.setToolPassive(ZoomTool.toolName);
      toolGroup.setToolPassive(LengthTool.toolName);

      // Add viewport to tool group
      toolGroup.addViewport(viewportId, renderingEngine.id);

      console.log('✅ Tools initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing tools:', error);
    }

    // Cleanup
    return function() {
      try {
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
        if (toolGroup) {
          toolGroup.removeViewports(renderingEngine.id, viewportId);
        }
      } catch (e) {
        console.warn('Error cleaning up tools:', e);
      }
    };
  }, [viewportId, renderingEngine]);

  /**
   * Set active tool
   */
  const setActiveTool = useCallback(function(toolId) {
    try {
      if (!window.cornerstone3DTools) return;

      const cornerstone3DTools = window.cornerstone3DTools;
      const {
        WindowLevelTool,
        PanTool,
        ZoomTool,
        LengthTool,
        ToolGroupManager,
        Enums: csToolsEnums,
      } = cornerstone3DTools;

      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) {
        console.warn('Tool group not found');
        return;
      }

      // Map toolbar tool IDs to Cornerstone tool names
      const toolNameMap = {
        'Wwwc': WindowLevelTool.toolName,
        'Pan': PanTool.toolName,
        'Zoom': ZoomTool.toolName,
        'Length': LengthTool.toolName,
      };

      const toolName = toolNameMap[toolId];
      if (!toolName) {
        console.warn('Unknown tool:', toolId);
        return;
      }

      // Deactivate all tools first
      toolGroup.setToolPassive(WindowLevelTool.toolName);
      toolGroup.setToolPassive(PanTool.toolName);
      toolGroup.setToolPassive(ZoomTool.toolName);
      toolGroup.setToolPassive(LengthTool.toolName);

      // Activate selected tool
      toolGroup.setToolActive(toolName, {
        bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
      });

      console.log(`✅ Activated tool: ${toolName}`);
    } catch (error) {
      console.error('Error setting active tool:', error);
    }
  }, []);

  /**
   * Reset viewport
   */
  const resetViewport = useCallback(function() {
    try {
      if (!renderingEngine) return;

      const viewport = renderingEngine.getViewport(viewportId);
      if (viewport) {
        viewport.resetCamera();
        viewport.resetProperties();
        viewport.render();
        console.log('✅ Viewport reset');
      }
    } catch (error) {
      console.error('Error resetting viewport:', error);
    }
  }, [viewportId, renderingEngine]);

  /**
   * Take screenshot
   */
  const takeScreenshot = useCallback(function() {
    try {
      if (!renderingEngine) return;

      const viewport = renderingEngine.getViewport(viewportId);
      if (viewport) {
        const canvas = viewport.getCanvas();
        const dataUrl = canvas.toDataURL('image/png');

        // Download the image
        const link = document.createElement('a');
        link.download = `dicom-screenshot-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        console.log('✅ Screenshot captured');
      }
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  }, [viewportId, renderingEngine]);

  return {
    setActiveTool,
    resetViewport,
    takeScreenshot,
  };
}

"use client";
import React from "react";
import ReactDOM from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

/**
 * A simple reusable portal. Renders `children` into
 * <div id="portal-root" /> in the main HTML, outside
 * of your normal React DOM hierarchy.
 */
const Portal: React.FC<PortalProps> = ({ children }) => {
  // Make sure we're in the browser
  if (typeof document === "undefined") return null;

  // Grab the #portal-root element; be sure you have
  // <div id="portal-root"></div> in your _document or index.html
  const portalRoot = document.getElementById("portal-root");
  return portalRoot ? ReactDOM.createPortal(children, portalRoot) : null;
};

export default Portal;

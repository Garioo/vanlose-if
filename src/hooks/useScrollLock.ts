"use client";

import { useEffect } from "react";

/**
 * Locks background scrolling while `active` is true.
 *
 * Uses `position: fixed` on the body rather than `overflow: hidden`, which iOS
 * Safari ignores. Reference-counted so nested locks (e.g. the mobile menu with
 * the search overlay on top of it) release correctly.
 */

let lockCount = 0;
let savedScrollY = 0;
let savedStyles: Partial<CSSStyleDeclaration> = {};

function lock() {
  const { body } = document;
  savedScrollY = window.scrollY;
  savedStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

function unlock() {
  const { body } = document;
  body.style.position = savedStyles.position ?? "";
  body.style.top = savedStyles.top ?? "";
  body.style.left = savedStyles.left ?? "";
  body.style.right = savedStyles.right ?? "";
  body.style.width = savedStyles.width ?? "";
  body.style.overflow = savedStyles.overflow ?? "";

  // `scroll-behavior: smooth` on <html> would animate this restore.
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, savedScrollY);
  root.style.scrollBehavior = previousBehavior;
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) lock();
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) unlock();
    };
  }, [active]);
}

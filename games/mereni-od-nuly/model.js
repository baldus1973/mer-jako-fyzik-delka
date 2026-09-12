(() => {
  'use strict';

  const SCENE_WIDTH_MM = 220;
  const SCENE_HEIGHT_MM = 82;
  const RULER_LENGTH_MM = 150;
  const OBJECT_TOP_MM = 18;
  const OBJECT_HEIGHT_MM = 12;
  const TARGET_GAP_MM = 1.5;

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function random() {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function generateTask(seed) {
    const random = mulberry32(seed);
    const objectStartMm = 35 + Math.floor(random() * 21);
    const lengthMm = 35 + Math.floor(random() * 86);
    const objectEndMm = objectStartMm + lengthMm;
    const correctRulerZeroMm = objectStartMm;
    const correctRulerTopMm = OBJECT_TOP_MM + OBJECT_HEIGHT_MM + TARGET_GAP_MM;

    const horizontalOffsetMm = pick([-18, -14, -10, 10, 14, 18], random);
    const verticalOffsetMm = pick([-10, -7, 7, 10], random);
    const initialRulerZeroMm = clamp(
      correctRulerZeroMm + horizontalOffsetMm,
      2,
      SCENE_WIDTH_MM - RULER_LENGTH_MM - 2,
    );
    const initialRulerTopMm = clamp(correctRulerTopMm + verticalOffsetMm, 16, 48);

    return Object.freeze({
      seed,
      objectStartMm,
      objectEndMm,
      objectTopMm: OBJECT_TOP_MM,
      objectHeightMm: OBJECT_HEIGHT_MM,
      lengthMm,
      targetGapMm: TARGET_GAP_MM,
      correctRulerZeroMm,
      correctRulerTopMm,
      initialRulerZeroMm,
      initialRulerTopMm,
      sceneWidthMm: SCENE_WIDTH_MM,
      sceneHeightMm: SCENE_HEIGHT_MM,
      rulerLengthMm: RULER_LENGTH_MM,
    });
  }

  globalThis.ZeroMeasurementGame = Object.freeze({
    SCENE_WIDTH_MM,
    SCENE_HEIGHT_MM,
    RULER_LENGTH_MM,
    OBJECT_TOP_MM,
    OBJECT_HEIGHT_MM,
    TARGET_GAP_MM,
    clamp,
    generateTask,
  });
})();

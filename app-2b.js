function placementText() {
  const placement = currentPlacement();
  if (!placement.edgeContact) {
    const rulerBelow = placement.actualGapMm > scenario.targetGapMm;
    return rulerBelow
      ? 'P\u0159isu\u0148 prav\u00edtko bl\u00ed\u017e k pastelce: posu\u0148 ho nahoru.'
      : 'Prav\u00edtko je p\u0159\u00edli\u0161 vysoko. Posu\u0148 ho trochu dol\u016f k hran\u011b pastelky.';
  }
  if (!placement.zeroAligned) {
    const rulerLeft = state.rulerX < state.objectX;
    return rulerLeft
      ? 'Prav\u00edtko je u pastelky. Posu\u0148 jeho nulu doprava k lev\u00e9mu konci pastelky.'
      : 'Prav\u00edtko je u pastelky. Posu\u0148 jeho nulu doleva k lev\u00e9mu konci pastelky.';
  }
  return 'Prav\u00edtko je spr\u00e1vn\u011b p\u0159ilo\u017een\u00e9: je u pastelky a nula je u jej\u00edho lev\u00e9ho konce.';
}

function updateAccessibleState() {
  const activeText = state.activeTarget === 'ruler'
    ? 'Aktivn\u00ed prvek je prav\u00edtko.'
    : state.activeTarget === 'object'
      ? 'Aktivn\u00ed prvek je pastelka.'
      : 'Nen\u00ed vybr\u00e1n \u017e\u00e1dn\u00fd prvek.';
  const guideColorName = GUIDE_COLOR_NAMES[state.guideColor] || GUIDE_COLOR_NAMES.red;
  const guidesText = state.guidesEnabled
    ? `Pomocn\u00e9 \u010d\u00e1ry jsou zapnut\u00e9, barva ${guideColorName}.`
    : 'Pomocn\u00e9 \u010d\u00e1ry jsou vypnut\u00e9.';
  els.accessibleState.textContent = `${activeText} ${placementText()} Zoom ${state.zoomPercent} procent. ${guidesText}`;
}

function updatePlacementStatus() {
  els.placementStatus.textContent = placementText();
  updateAccessibleState();
}

function clientToSvg(event) {
  const point = els.scene.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const ctm = els.scene.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

function getPosition(target) {
  return target === 'object'
    ? { x: state.objectX, y: state.objectY }
    : { x: state.rulerX, y: state.rulerY };
}

function pointerDown(target, event) {
  if (event.button !== undefined && event.button !== 0) return;
  setActiveTarget(target);
  state.draggingTarget = target;
  state.pointerId = event.pointerId;
  state.dragStartPoint = clientToSvg(event);
  state.dragStartPosition = getPosition(target);
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function pointerMove(event) {
  if (!state.draggingTarget || event.pointerId !== state.pointerId) return;
  const point = clientToSvg(event);
  const dx = point.x - state.dragStartPoint.x;
  const dy = point.y - state.dragStartPoint.y;
  setPosition(
    state.draggingTarget,
    state.dragStartPosition.x + dx,
    state.dragStartPosition.y + dy,
  );
}

function pointerUp(event) {
  if (event.pointerId !== state.pointerId) return;
  state.draggingTarget = null;
  state.pointerId = null;
  state.dragStartPoint = null;
  state.dragStartPosition = null;
}

function moveTarget(target, dx, dy) {
  if (!target) return;
  const pos = getPosition(target);
  setPosition(target, pos.x + dx, pos.y + dy);
}

function onMovableKeydown(target, event) {
  if (event.key === 'Escape') {
    clearActiveTarget();
    event.preventDefault();
    return;
  }
  const step = event.shiftKey ? 0.5 : 1;
  let dx = 0;
  let dy = 0;
  if (event.key === 'ArrowLeft') dx = -step;
  else if (event.key === 'ArrowRight') dx = step;
  else if (event.key === 'ArrowUp') dy = -step;
  else if (event.key === 'ArrowDown') dy = step;
  else return;
  setActiveTarget(target);
  moveTarget(target, dx, dy);
  event.preventDefault();
}


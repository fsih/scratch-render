const ScratchRender = require('../RenderWebGL');

const canvas = document.getElementById('scratch-stage');
const renderer = new ScratchRender(canvas);
renderer.setLayerGroupOrdering(['group1']);

const drawableID2 = renderer.createDrawable('group1');

// SVG (cat 1-a)
const xhr = new XMLHttpRequest();
xhr.addEventListener('load', function () {
    const skinId = renderer.createSVGSkin(xhr.responseText);
    renderer.updateDrawableProperties(drawableID2, {
        skinId: skinId
    });
});
xhr.open('GET', 'https://cdn.assets.scratch.mit.edu/internalapi/asset/b7853f557e4426412e64bb3da6531a99.svg/get/');
xhr.send();

const drawStep = function () {
    renderer.draw();
    requestAnimationFrame(drawStep);
};
drawStep();

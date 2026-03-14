/**
 * Prensa Sala de Prensa — JavaScript
 * Lightbox, Copy Text, Toast, Placeholder fallback
 */
(function () {
    'use strict';

    // ── Placeholder generator for missing images ──
    window.generarPlaceholder = function (filename) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
            '<rect width="800" height="600" fill="#F7F7FD"/>' +
            '<rect width="760" height="560" x="20" y="20" fill="none" stroke="#ECECF3" stroke-width="2" stroke-dasharray="10 10" rx="12"/>' +
            '<circle cx="400" cy="250" r="40" fill="#ECECF3"/>' +
            '<path d="M385 250l30-20v40z" fill="#9F57A7" opacity="0.5"/>' +
            '<text x="50%" y="320" font-family="Outfit, sans-serif" font-weight="600" font-size="18" fill="#11103B" text-anchor="middle">Vista previa no disponible</text>' +
            '<text x="50%" y="350" font-family="monospace" font-size="13" fill="#4E4E54" text-anchor="middle">' + filename + '</text>' +
            '</svg>';
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    // ── Toast ──
    function showToast(msg) {
        var toast = document.getElementById('prensa-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 3000);
    }

    // ── Copy text ──
    window.copiarTexto = function (elementId) {
        var el = document.getElementById(elementId);
        if (!el) return;
        var paragraphs = el.querySelectorAll('p');
        var text = Array.prototype.map.call(paragraphs, function (p) { return p.innerText; }).join('\n\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showToast('Texto copiado exitosamente');
            }, function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    };

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('Texto copiado exitosamente');
        } catch (e) {
            showToast('Error al copiar');
        }
        document.body.removeChild(ta);
    }

    // ── Lightbox ──
    var lightbox = document.getElementById('prensa-lightbox');
    if (!lightbox) return;

    var lbImg = document.getElementById('lb-img');
    var lbTitle = document.getElementById('lb-title');
    var lbFilename = document.getElementById('lb-filename');
    var lbCounter = document.getElementById('lb-counter');
    var lbDownload = document.getElementById('lb-download');
    var lbClose = document.getElementById('lb-close');
    var lbPrev = document.getElementById('lb-prev');
    var lbNext = document.getElementById('lb-next');

    // Build images data from gallery items
    var galleryItems = document.querySelectorAll('.gallery-item[data-index]');
    var imagesData = [];

    Array.prototype.forEach.call(galleryItems, function (item) {
        var img = item.querySelector('.gallery-item__img-wrap img');
        if (!img) return;
        var src = img.getAttribute('src');
        var filename = src.split('/').pop();
        imagesData.push({
            src: src,
            title: filename.replace(/\.[^.]+$/, ''),
            filename: filename
        });
    });

    var currentIndex = 0;

    function openLightbox(index) {
        currentIndex = index;
        updateLightbox();
        lightbox.classList.add('is-active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function changeImage(step) {
        currentIndex += step;
        if (currentIndex < 0) currentIndex = imagesData.length - 1;
        if (currentIndex >= imagesData.length) currentIndex = 0;

        lbImg.style.transform = 'scale(0.95)';
        lbImg.style.opacity = '0.5';
        setTimeout(function () {
            updateLightbox();
            lbImg.style.transform = 'scale(1)';
            lbImg.style.opacity = '1';
        }, 150);
    }

    function updateLightbox() {
        var data = imagesData[currentIndex];
        if (!data) return;

        lbImg.src = data.src;
        lbImg.alt = data.title;
        lbTitle.textContent = data.title;
        lbFilename.textContent = data.filename;
        lbCounter.textContent = (currentIndex + 1) + ' / ' + imagesData.length;
        lbDownload.href = data.src;
        lbDownload.setAttribute('download', data.filename);
    }

    // Event listeners — gallery clicks
    Array.prototype.forEach.call(galleryItems, function (item) {
        var index = parseInt(item.getAttribute('data-index'), 10);

        // Click on image wrapper opens lightbox
        var imgWrap = item.querySelector('.gallery-item__img-wrap');
        if (imgWrap) {
            imgWrap.addEventListener('click', function () { openLightbox(index); });
        }

        // View button
        var viewBtn = item.querySelector('[data-action="view"]');
        if (viewBtn) {
            viewBtn.addEventListener('click', function () { openLightbox(index); });
        }
    });

    // Lightbox controls
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { changeImage(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { changeImage(1); });

    // Click on backdrop closes
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.classList.contains('prensa-lightbox__body')) {
            closeLightbox();
        }
    });

    // Keyboard nav
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('is-active')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight') changeImage(1);
        else if (e.key === 'ArrowLeft') changeImage(-1);
    });
})();

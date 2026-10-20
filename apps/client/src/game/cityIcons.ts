import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BUILDINGS, type BuildingId } from '@mt/shared';
import type { Textures } from 'phaser';
import { BUILDING_ICONS } from '../ui/icons';

export const ICON_PX = 64;
export const iconKey = (id: BuildingId) => `icon-${id}`;

/** SVG иконки Phosphor → data URI (те же иконки, что в React-интерфейсе) */
function iconDataUri(id: BuildingId, color = '#201e1d'): string {
    let svg = renderToStaticMarkup(createElement(BUILDING_ICONS[id], { size: ICON_PX, weight: 'duotone', color }));
    if (!svg.includes('xmlns=')) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Добавляет иконки зданий в текстуры Phaser. Загрузчик SVG в Phaser 4 не принимает data URI,
 * поэтому грузим через обычный Image.
 */
export function loadBuildingIcons(textures: Textures.TextureManager): Promise<void> {
    return Promise.all(
        BUILDINGS.map(
            (b) =>
                new Promise<void>((resolve) => {
                    if (textures.exists(iconKey(b.id))) return resolve();
                    const img = new Image(ICON_PX, ICON_PX);
                    img.onload = () => {
                        textures.addImage(iconKey(b.id), img);
                        resolve();
                    };
                    img.onerror = () => resolve(); // без иконки карта всё равно работает
                    img.src = iconDataUri(b.id);
                }),
        ),
    ).then(() => undefined);
}

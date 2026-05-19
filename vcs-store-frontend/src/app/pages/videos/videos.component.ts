import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [NgFor],
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss',
})
export class VideosComponent {
  videos = [
    {
      title: 'VYRO — Brand Intro',
      description: 'Identidad de marca y esencia de la colección.',
      composition: 'vyro-brand-intro',
      width: 1920,
      height: 1080,
    },
    {
      title: 'VYRO — Product Promo',
      description: 'Showcase dinámico de prenda con precio y CTA.',
      composition: 'vyro-product-promo',
      width: 1080,
      height: 1920,
    },
  ];
}

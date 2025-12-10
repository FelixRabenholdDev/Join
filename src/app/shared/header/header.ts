import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
  this.menuOpen = false;
}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Wenn Menü offen ist
    if (this.menuOpen) {
      const clickedInsideMenu = target.closest('.menu');
      const clickedOnMenuIcon = target.closest('.menu-icon');

      if (!clickedInsideMenu && !clickedOnMenuIcon) {
        this.menuOpen = false;
      }
    }
  }
}

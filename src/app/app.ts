import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root Application Component
 * 
 * Serves as the main entry point of the Angular application. Manages the routing outlet
 * where all route-based components are rendered. Uses Angular signals for reactive state management.
 * 
 * @component
 * @selector app-root
 * @standalone true
 * @imports [RouterOutlet]
 * 
 * @example
 * // This is bootstrapped in main.ts
 * bootstrapApplication(App, appConfig)
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /**
   * Application title signal
   * Reactive value for the application name displayed in the UI
   * Uses Angular's signal-based reactivity for fine-grained change detection
   * 
   * @type {WritableSignal<string>}
   * @default 'Join'
   */
  protected readonly title = signal('Join');
}

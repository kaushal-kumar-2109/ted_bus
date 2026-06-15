import { Component, OnInit, Injectable } from '@angular/core';
import { LanguageService } from '../../service/language.service';
import { ThemeService } from '../../service/theme.service';

interface RouteOption {
  id: string;
  name: string;
  distance: number;
  duration: number;
  congestion: string; // 'low' | 'medium' | 'high'
  delay: number; // in minutes
  color: string; // SVG path stroke color
  pathD: string; // SVG path definition
}

@Injectable({
  providedIn: 'root'
})
class RouteSaver {
  save(route: any) {
    const saved = this.getAll();
    saved.push(route);
    localStorage.setItem('saved_routes', JSON.stringify(saved));
  }
  getAll(): any[] {
    const data = localStorage.getItem('saved_routes');
    return data ? JSON.parse(data) : [];
  }
}

@Component({
  selector: 'app-route-planner',
  templateUrl: './route-planner.component.html',
  styleUrls: ['./route-planner.component.css']
})
export class RoutePlannerComponent implements OnInit {
  startLocation: string = 'Delhi';
  destination: string = 'Jaipur';
  waypoints: string[] = [];
  availableCities: string[] = ['Delhi', 'Jaipur', 'Mumbai', 'Goa', 'Bangalore', 'Mysore', 'Chennai', 'Pondicherry', 'Kolkata', 'Darjeeling', 'Pune'];
  
  routeOptions: RouteOption[] = [];
  selectedRoute: RouteOption | null = null;
  savedRoutes: any[] = [];
  
  trafficAlerts: string[] = [
    'CONGESTION ALERT: 15 min delay on NH48 near Gurgaon due to early morning bottleneck.',
    'ROADWORK UPDATE: Single lane traffic on Jaipur bypass. Expect minor delays.',
    'WEATHER ALERT: Foggy conditions reported near Neemrana. Drive safe.',
    'TRAFFIC ALERT: Smooth traffic on Eastern Peripheral Expressway.'
  ];
  currentAlertIndex: number = 0;
  activeAlert: string = '';

  constructor(
    public lang: LanguageService,
    public theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.activeAlert = this.trafficAlerts[0];
    this.loadSavedRoutes();
    this.calculateRoutes();
    
    // Alert Ticker loop
    setInterval(() => {
      this.currentAlertIndex = (this.currentAlertIndex + 1) % this.trafficAlerts.length;
      this.activeAlert = this.trafficAlerts[this.currentAlertIndex];
    }, 6000);
  }

  addWaypoint(): void {
    if (this.waypoints.length < 3) {
      this.waypoints.push('');
      this.calculateRoutes();
    }
  }

  removeWaypoint(index: number): void {
    this.waypoints.splice(index, 1);
    this.calculateRoutes();
  }

  updateWaypoint(index: number, val: string): void {
    this.waypoints[index] = val;
    this.calculateRoutes();
  }

  onRouteSelect(option: RouteOption): void {
    this.selectedRoute = option;
  }

  calculateRoutes(): void {
    // Determine coordinates and paths based on destinations
    // We generate 3 mock route paths for our interactive SVG map canvas
    const baseDist = this.waypoints.length * 80 + 260; // scale distance with waypoints
    const baseDur = this.waypoints.length * 1.5 + 5.0;

    this.routeOptions = [
      {
        id: 'route-fast',
        name: 'National Highway NH48 (Fastest Route)',
        distance: baseDist,
        duration: baseDur,
        congestion: 'low',
        delay: 0,
        color: '#10b981', // emerald green
        pathD: 'M 50 250 Q 200 150 350 220 T 650 200'
      },
      {
        id: 'route-scenic',
        name: 'State Highway SH12 (Scenic Bypass)',
        distance: baseDist + 35,
        duration: baseDur + 1.2,
        congestion: 'medium',
        delay: 15,
        color: '#f59e0b', // amber yellow
        pathD: 'M 50 250 Q 220 320 380 180 T 650 200'
      },
      {
        id: 'route-alternate',
        name: 'Bhiwadi Expressway Alternative',
        distance: baseDist + 52,
        duration: baseDur + 2.1,
        congestion: 'high',
        delay: 35,
        color: '#ef4444', // rose red
        pathD: 'M 50 250 Q 150 50 400 120 T 650 200'
      }
    ];

    this.selectedRoute = this.routeOptions[0];
  }

  saveCurrentRoute(): void {
    if (!this.selectedRoute) return;
    
    const routeToSave = {
      start: this.startLocation,
      end: this.destination,
      waypoints: [...this.waypoints],
      routeName: this.selectedRoute.name,
      distance: this.selectedRoute.distance,
      duration: this.selectedRoute.duration,
      dateSaved: new Date().toLocaleDateString()
    };

    const saved = this.getSavedRoutesFromStore();
    saved.push(routeToSave);
    localStorage.setItem('saved_routes_planner', JSON.stringify(saved));
    this.loadSavedRoutes();
    alert('Route successfully saved to your profile!');
  }

  private getSavedRoutesFromStore(): any[] {
    const data = localStorage.getItem('saved_routes_planner');
    return data ? JSON.parse(data) : [];
  }

  loadSavedRoutes(): void {
    this.savedRoutes = this.getSavedRoutesFromStore();
  }

  clearSavedRoutes(): void {
    localStorage.removeItem('saved_routes_planner');
    this.savedRoutes = [];
  }

  loadRoute(saved: any): void {
    this.startLocation = saved.start;
    this.destination = saved.end;
    this.waypoints = [...saved.waypoints];
    this.calculateRoutes();
  }
}

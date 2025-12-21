declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options?: google.maps.MapOptions) => google.maps.Map;
        Marker: new (options?: google.maps.MarkerOptions) => google.maps.Marker;
        InfoWindow: new (options?: google.maps.InfoWindowOptions) => google.maps.InfoWindow;
        SymbolPath: {
          CIRCLE: google.maps.SymbolPath;
        };
      };
    };
  }
  
  namespace google {
    namespace maps {
      interface Map {
        setCenter(latlng: LatLng | LatLngLiteral): void;
        panTo(latlng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }
      
      interface Marker {
        setPosition(latlng: LatLng | LatLngLiteral): void;
        setIcon(icon: string | Icon | Symbol): void;
        addListener(eventName: string, handler: Function): MapsEventListener;
      }
      
      interface InfoWindow {
        open(map?: Map | StreetViewPanorama, anchor?: Marker): void;
        close(): void;
      }
      
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      
      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        zoomControl?: boolean;
        styles?: MapTypeStyle[];
      }
      
      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map | StreetViewPanorama;
        title?: string;
        icon?: string | Icon | Symbol;
      }
      
      interface InfoWindowOptions {
        content?: string | Node;
      }
      
      interface Icon {
        path?: SymbolPath | string;
        scale?: number;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
      }
      
      interface Symbol {
        path?: SymbolPath | string;
        scale?: number;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
      }
      
      enum SymbolPath {
        CIRCLE = 0,
        BACKWARD_CLOSED_ARROW = 1,
        BACKWARD_OPEN_ARROW = 2,
        FORWARD_CLOSED_ARROW = 3,
        FORWARD_OPEN_ARROW = 4,
      }
      
      interface MapTypeStyle {
        featureType?: string;
        elementType?: string;
        stylers?: Array<Record<string, unknown>>;
      }
      
      interface StreetViewPanorama {}
      
      interface MapsEventListener {
        remove(): void;
      }
    }
  }
}

export {};


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Producto } from '../models/product.model';

export interface PaginatedResponse {
  data: Producto[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProductQuery {
  search?: string;
  categoria_id?: number;
  por_encargo?: boolean;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(query: ProductQuery = {}): Observable<PaginatedResponse> {
    const params: Record<string, string | number> = {};
    if (query.search) params['search'] = query.search;
    if (query.categoria_id) params['categoria_id'] = query.categoria_id;
    if (query.por_encargo != null) params['por_encargo'] = query.por_encargo ? 'true' : 'false';
    if (query.sort_by) params['sort_by'] = query.sort_by;
    if (query.sort_order) params['sort_order'] = query.sort_order;
    params['limit'] = query.limit ?? 20;
    params['offset'] = query.offset ?? 0;
    return this.http.get<PaginatedResponse>(`${environment.apiUrl}/api/productos`, { params });
  }
}

export interface PetService {
  id: string;
  tenant_id: string;
  type: 'naming' | 'liberation' | 'accessories' | 'diet';
  name: string;
  description: string;
  icon: string;
  price?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PetOrder {
  id: string;
  tenant_id: string;
  user_id: string;
  service_type: string;
  service_id: string;
  data: Record<string, unknown>;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

const MOCK_PET_SERVICES: Record<string, PetService[]> = {
  muxintang: [
    {
      id: 'pet-naming',
      tenant_id: 'muxintang',
      type: 'naming',
      name: '宠物起名',
      description: '为萌宠赐名，福泽相伴',
      icon: '🐾',
      is_active: true,
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pet-liberation',
      tenant_id: 'muxintang',
      type: 'liberation',
      name: '积德行善',
      description: '放生祈福，积累福报',
      icon: '🕊️',
      is_active: true,
      sort_order: 2,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pet-accessories',
      tenant_id: 'muxintang',
      type: 'accessories',
      name: '吉祥饰品',
      description: '佩戴祥瑞，平安喜乐',
      icon: '🔔',
      is_active: true,
      sort_order: 3,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pet-diet',
      tenant_id: 'muxintang',
      type: 'diet',
      name: '饮食调理',
      description: '科学喂养，健康成长',
      icon: '🥣',
      is_active: true,
      sort_order: 4,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
};

export async function getPetServices(tenantId: string): Promise<PetService[]> {
  return MOCK_PET_SERVICES[tenantId] || [];
}

export async function getPetServiceById(tenantId: string, serviceId: string): Promise<PetService | null> {
  const services = MOCK_PET_SERVICES[tenantId] || [];
  return services.find((s) => s.id === serviceId) || null;
}

export async function getPetServicesByType(tenantId: string, type: PetService['type']): Promise<PetService[]> {
  const services = MOCK_PET_SERVICES[tenantId] || [];
  return services.filter((s) => s.type === type && s.is_active);
}

export async function createPetOrder(tenantId: string, userId: string, serviceType: string, serviceId: string, data: Record<string, unknown>): Promise<PetOrder> {
  const order: PetOrder = {
    id: `PET-ORD-${Date.now()}`,
    tenant_id: tenantId,
    user_id: userId,
    service_type: serviceType,
    service_id: serviceId,
    data,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  
  return order;
}

export async function getPetOrdersByUser(tenantId: string, userId: string): Promise<PetOrder[]> {
  return [];
}

export async function getPetOrderById(tenantId: string, orderId: string): Promise<PetOrder | null> {
  return null;
}

export async function updatePetOrderStatus(tenantId: string, orderId: string, status: PetOrder['status']): Promise<PetOrder | null> {
  return null;
}
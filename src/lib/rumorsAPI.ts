/**
 * 小道消息API工具函数
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/v1/rumors';

export interface Rumor {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAddress: string;
  authorAvatar?: string;
  authorVipLevel?: number;
  timestamp: string;
  likes: number;
  dislikes: number;
  flowers: number;
  eggs: number;
  shares: number;
  category: 'exchange' | 'project' | 'funding' | 'security' | 'policy' | 'airdrop' | 'bullish' | 'bearish' | 'neutral' | 'news';
  credibility: number;
  evidence?: string;
  status: 'pending' | 'verified' | 'disproven';
  evidence_count: number;
}

export interface CreateRumorData {
  title: string;
  content: string;
  category: 'exchange' | 'project' | 'funding' | 'security' | 'policy' | 'airdrop' | 'bullish' | 'bearish' | 'neutral' | 'news';
  credibility: number;
  evidence?: string;
  wallet_address: string;
}

export interface RumorsListResponse {
  rumors: Rumor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InteractionData {
  rumor_id: number;
  interaction_type: 'like' | 'dislike' | 'flower' | 'egg';
}

export interface InteractionResponse {
  likes: number;
  dislikes: number;
  flowers: number;
  eggs: number;
  user_interaction: 'like' | 'dislike' | 'flower' | 'egg' | null;
}

export interface ShareData {
  rumor_id: number;
}

export interface ShareResponse {
  shares: number;
}

// 证据相关接口
export interface Evidence {
  id: string;
  rumor_id: string;
  evidence_type: 'link' | 'image' | 'text';
  evidence_direction: 'support' | 'oppose';
  evidence_content: string;
  evidence_description?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_initial: boolean;
  created_at: string;
  updated_at: string;
  submitter_name: string;
  submitter_avatar?: string;
  submitter_address: string;
  submitter_vip_level?: number;
}

export interface EvidenceListResponse {
  evidence_list: Evidence[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AddEvidenceData {
  rumor_id: number;
  evidence_content: string;
  evidence_description?: string;
  evidence_direction: 'support' | 'oppose';
}

// 威望相关接口
export interface UserRank {
  rank: number;
  rank_name: string;
  rumors_count: number;
  interactions_count: number;
  evidence_count: number;
  point: number;
}


/**
 * 获取小道消息列表
 */
export async function getRumors(params: {
  category?: string;
  sort?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<RumorsListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.category) searchParams.append('category', params.category);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/list?${searchParams.toString()}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.api_code !== 200) {
    throw new Error(data.api_msg || '获取小道消息失败');
  }
  
  return data.data;
}

/**
 * 创建小道消息
 */
export async function createRumor(data: CreateRumorData): Promise<{ rumor_id: number }> {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (result.api_code !== 200) {
    throw new Error(result.api_msg || '发布小道消息失败');
  }
  
  return result.data;
}

/**
 * 小道消息互动（点赞、鲜花、扔鸡蛋等）
 */
export async function interactRumor(data: InteractionData): Promise<InteractionResponse> {
  const response = await fetch(`${API_BASE_URL}/interact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (result.api_code !== 200) {
    throw new Error(result.api_msg || '互动失败');
  }
  
  return result.data;
}

/**
 * 小道消息分享 (已弃用 - 现在使用React Share组件)
 * @deprecated 不再使用分享计数功能
 */
export async function shareRumor(data: ShareData): Promise<ShareResponse> {
  const response = await fetch(`${API_BASE_URL}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (result.api_code !== 200) {
    throw new Error(result.api_msg || '分享失败');
  }
  
  return result.data;
}

/**
 * 获取证据列表
 */
export async function getEvidence(params: {
  rumor_id: number;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<EvidenceListResponse> {
  const searchParams = new URLSearchParams({
    rumor_id: params.rumor_id.toString(),
  });
  
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/getEvidence?${searchParams.toString()}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.api_code !== 200) {
    throw new Error(data.api_msg || '获取证据列表失败');
  }
  
  return data.data;
}

/**
 * 添加证据
 */
export async function addEvidence(data: AddEvidenceData): Promise<{ evidence_id: number }> {
  const response = await fetch(`${API_BASE_URL}/addEvidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (result.api_code !== 200) {
    throw new Error(result.api_msg || '添加证据失败');
  }
  
  return result.data;
}

/**
 * 获取用户威望信息
 */
export async function getUserRank(): Promise<UserRank> {
  const response = await fetch(`${API_BASE_URL}/rank`);
  const data = await response.json();
  
  if (data.api_code !== 200) {
    throw new Error(data.api_msg || '获取威望信息失败');
  }
  
  return data.data;
}


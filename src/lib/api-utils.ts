import { NextResponse } from 'next/server'

// API Response utilities
export class ApiResponse {
  static success(data: any, status: number = 200) {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status })
  }

  static error(message: string, status: number = 500, details?: any) {
    return NextResponse.json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }, { status })
  }

  static created(data: any) {
    return this.success(data, 201)
  }

  static notFound(message: string = 'Resource not found') {
    return this.error(message, 404)
  }

  static badRequest(message: string, details?: any) {
    return this.error(message, 400, details)
  }

  static conflict(message: string) {
    return this.error(message, 409)
  }

  static unauthorized(message: string = 'Unauthorized') {
    return this.error(message, 401)
  }

  static forbidden(message: string = 'Forbidden') {
    return this.error(message, 403)
  }
}

// Validation utilities
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static validateLeadData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.company_name?.trim()) {
      errors.push('Company name is required')
    }

    if (!data.person_name?.trim()) {
      errors.push('Person name is required')
    }

    if (!data.email?.trim()) {
      errors.push('Email is required')
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Invalid email format')
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format')
    }

    if (data.linkedin_profile_url && !this.isValidUrl(data.linkedin_profile_url)) {
      errors.push('Invalid LinkedIn URL format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Pagination utilities
export class PaginationUtils {
  static getPaginationParams(searchParams: URLSearchParams) {
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1

    return {
      limit: Math.min(limit, 100), // Max 100 items per page
      offset: offset || (page - 1) * limit,
      page
    }
  }

  static createPaginationResponse(data: any[], total: number, limit: number, offset: number) {
    const totalPages = Math.ceil(total / limit)
    const currentPage = Math.floor(offset / limit) + 1

    return {
      data,
      pagination: {
        total,
        totalPages,
        currentPage,
        limit,
        offset,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    }
  }
} 
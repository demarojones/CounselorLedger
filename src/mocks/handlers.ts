import { http, HttpResponse } from 'msw';
import { getMockData } from './data/seedData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';

// Get mock data instance
const mockData = getMockData();

export const handlers = [
  // Auth endpoints - signInWithPassword
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; grant_type?: string };
    
    console.log('🔐 Mock Auth: Login attempt for', body.email);

    // Support both 'password' grant_type and signInWithPassword (which uses grant_type: 'password')
    const user = mockData.users.find(u => u.email === body.email);

    if (user) {
      console.log('✅ Mock Auth: Login successful for', user.email, `(${user.role})`);
      return HttpResponse.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            tenant_id: user.tenantId,
          },
        },
      });
    }

    console.log('❌ Mock Auth: Login failed - user not found');
    return HttpResponse.json(
      { 
        error: 'Invalid login credentials',
        error_description: 'Invalid login credentials'
      }, 
      { status: 400 }
    );
  }),

  // Get current user
  http.get(`${SUPABASE_URL}/auth/v1/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    // If no auth header or it's not a valid token, return 401
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const currentUser = mockData.users[0]; // Default to first user

    return HttpResponse.json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        created_at: currentUser.createdAt,
        updated_at: currentUser.updatedAt,
        user_metadata: {
          first_name: currentUser.firstName,
          last_name: currentUser.lastName,
          role: currentUser.role,
          tenant_id: currentUser.tenantId,
        },
      },
    });
  }),

  // Get session
  http.get(`${SUPABASE_URL}/auth/v1/session`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('mock-access-token')) {
      return HttpResponse.json({ data: { session: null } });
    }

    const currentUser = mockData.users[0];

    return HttpResponse.json({
      data: {
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: currentUser.id,
            email: currentUser.email,
            created_at: currentUser.createdAt,
            updated_at: currentUser.updatedAt,
            user_metadata: {
              first_name: currentUser.firstName,
              last_name: currentUser.lastName,
              role: currentUser.role,
              tenant_id: currentUser.tenantId,
            },
          },
        },
      },
    });
  }),

  // Logout
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  // Refresh session
  http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, () => {
    const currentUser = mockData.users[0];

    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: currentUser.id,
        email: currentUser.email,
        created_at: currentUser.createdAt,
        updated_at: currentUser.updatedAt,
        user_metadata: {
          first_name: currentUser.firstName,
          last_name: currentUser.lastName,
          role: currentUser.role,
          tenant_id: currentUser.tenantId,
        },
      },
    });
  }),

  // Students endpoints
  http.get(`${SUPABASE_URL}/rest/v1/students`, () => {
    // Convert to DB format
    const students = mockData.students.map(s => ({
      id: s.id,
      tenant_id: s.tenantId,
      student_id: s.studentId,
      first_name: s.firstName,
      last_name: s.lastName,
      grade_level: s.gradeLevel,
      email: s.email,
      phone: s.phone,
      needs_follow_up: s.needsFollowUp,
      follow_up_notes: s.followUpNotes,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));

    return HttpResponse.json(students);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/students/:id`, ({ params }) => {
    const student = mockData.students.find(s => s.id === params.id);

    if (student) {
      const dbStudent = {
        id: student.id,
        tenant_id: student.tenantId,
        student_id: student.studentId,
        first_name: student.firstName,
        last_name: student.lastName,
        grade_level: student.gradeLevel,
        email: student.email,
        phone: student.phone,
        needs_follow_up: student.needsFollowUp,
        follow_up_notes: student.followUpNotes,
        created_at: student.createdAt,
        updated_at: student.updatedAt,
      };
      return HttpResponse.json(dbStudent);
    }

    return HttpResponse.json({ error: 'Student not found' }, { status: 404 });
  }),

  http.post(`${SUPABASE_URL}/rest/v1/students`, async ({ request }) => {
    const body = await request.json() as any;
    const currentUser = mockData.users[0];
    
    const newStudent = {
      id: crypto.randomUUID(),
      tenantId: currentUser.tenantId,
      studentId: body.student_id,
      firstName: body.first_name,
      lastName: body.last_name,
      gradeLevel: body.grade_level,
      email: body.email,
      phone: body.phone,
      needsFollowUp: body.needs_follow_up || false,
      followUpNotes: body.follow_up_notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockData.students.push(newStudent);
    
    const dbStudent = {
      id: newStudent.id,
      tenant_id: newStudent.tenantId,
      student_id: newStudent.studentId,
      first_name: newStudent.firstName,
      last_name: newStudent.lastName,
      grade_level: newStudent.gradeLevel,
      email: newStudent.email,
      phone: newStudent.phone,
      needs_follow_up: newStudent.needsFollowUp,
      follow_up_notes: newStudent.followUpNotes,
      created_at: newStudent.createdAt,
      updated_at: newStudent.updatedAt,
    };
    
    return HttpResponse.json(dbStudent, { status: 201 });
  }),

  // Contacts endpoints
  http.get(`${SUPABASE_URL}/rest/v1/contacts`, () => {
    // Convert to DB format
    const contacts = mockData.contacts.map(c => ({
      id: c.id,
      tenant_id: c.tenantId,
      first_name: c.firstName,
      last_name: c.lastName,
      relationship: c.relationship,
      email: c.email,
      phone: c.phone,
      organization: c.organization,
      notes: c.notes,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));

    return HttpResponse.json(contacts);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/contacts/:id`, ({ params }) => {
    const contact = mockData.contacts.find(c => c.id === params.id);

    if (contact) {
      const dbContact = {
        id: contact.id,
        tenant_id: contact.tenantId,
        first_name: contact.firstName,
        last_name: contact.lastName,
        relationship: contact.relationship,
        email: contact.email,
        phone: contact.phone,
        organization: contact.organization,
        notes: contact.notes,
        created_at: contact.createdAt,
        updated_at: contact.updatedAt,
      };
      return HttpResponse.json(dbContact);
    }

    return HttpResponse.json({ error: 'Contact not found' }, { status: 404 });
  }),

  http.post(`${SUPABASE_URL}/rest/v1/contacts`, async ({ request }) => {
    const body = await request.json() as any;
    const currentUser = mockData.users[0];
    
    const newContact = {
      id: crypto.randomUUID(),
      tenantId: currentUser.tenantId,
      firstName: body.first_name,
      lastName: body.last_name,
      relationship: body.relationship,
      email: body.email,
      phone: body.phone,
      organization: body.organization,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockData.contacts.push(newContact);
    
    const dbContact = {
      id: newContact.id,
      tenant_id: newContact.tenantId,
      first_name: newContact.firstName,
      last_name: newContact.lastName,
      relationship: newContact.relationship,
      email: newContact.email,
      phone: newContact.phone,
      organization: newContact.organization,
      notes: newContact.notes,
      created_at: newContact.createdAt,
      updated_at: newContact.updatedAt,
    };
    
    return HttpResponse.json(dbContact, { status: 201 });
  }),

  // Interactions endpoints
  http.get(`${SUPABASE_URL}/rest/v1/interactions`, ({ request }) => {
    const url = new URL(request.url);
    const order = url.searchParams.get('order');

    // Convert to DB format (snake_case)
    const interactions = mockData.interactions.map(i => ({
      id: i.id,
      tenant_id: i.tenantId,
      counselor_id: i.counselorId,
      student_id: i.studentId,
      contact_id: i.contactId,
      category_id: i.categoryId,
      subcategory_id: i.subcategoryId,
      custom_reason: i.customReason,
      start_time: i.startTime,
      duration_minutes: i.durationMinutes,
      end_time: i.endTime,
      notes: i.notes,
      needs_follow_up: i.needsFollowUp,
      follow_up_date: i.followUpDate,
      follow_up_notes: i.followUpNotes,
      is_follow_up_complete: i.isFollowUpComplete,
      created_at: i.createdAt,
      updated_at: i.updatedAt,
    }));

    if (order?.includes('start_time')) {
      interactions.sort((a, b) => {
        const dateA = new Date(a.start_time).getTime();
        const dateB = new Date(b.start_time).getTime();
        return order.includes('desc') ? dateB - dateA : dateA - dateB;
      });
    }

    return HttpResponse.json(interactions);
  }),

  http.get(`${SUPABASE_URL}/rest/v1/interactions/:id`, ({ params }) => {
    const interaction = mockData.interactions.find(i => i.id === params.id);

    if (interaction) {
      // Convert to DB format
      const dbInteraction = {
        id: interaction.id,
        tenant_id: interaction.tenantId,
        counselor_id: interaction.counselorId,
        student_id: interaction.studentId,
        contact_id: interaction.contactId,
        category_id: interaction.categoryId,
        subcategory_id: interaction.subcategoryId,
        custom_reason: interaction.customReason,
        start_time: interaction.startTime,
        duration_minutes: interaction.durationMinutes,
        end_time: interaction.endTime,
        notes: interaction.notes,
        needs_follow_up: interaction.needsFollowUp,
        follow_up_date: interaction.followUpDate,
        follow_up_notes: interaction.followUpNotes,
        is_follow_up_complete: interaction.isFollowUpComplete,
        created_at: interaction.createdAt,
        updated_at: interaction.updatedAt,
      };
      return HttpResponse.json(dbInteraction);
    }

    return HttpResponse.json({ error: 'Interaction not found' }, { status: 404 });
  }),

  http.post(`${SUPABASE_URL}/rest/v1/interactions`, async ({ request }) => {
    const body = await request.json() as any;
    
    // Get current user's tenant
    const currentUser = mockData.users[0];
    
    const newInteraction = {
      id: crypto.randomUUID(),
      tenantId: currentUser.tenantId,
      counselorId: body.counselor_id,
      studentId: body.student_id || undefined,
      contactId: body.contact_id || undefined,
      categoryId: body.category_id,
      subcategoryId: body.subcategory_id || undefined,
      customReason: body.custom_reason || undefined,
      startTime: body.start_time,
      durationMinutes: body.duration_minutes,
      endTime: body.end_time,
      notes: body.notes || undefined,
      needsFollowUp: body.needs_follow_up || false,
      followUpDate: body.follow_up_date || undefined,
      followUpNotes: body.follow_up_notes || undefined,
      isFollowUpComplete: body.is_follow_up_complete || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockData.interactions.push(newInteraction);
    
    // Return in DB format
    const dbInteraction = {
      id: newInteraction.id,
      tenant_id: newInteraction.tenantId,
      counselor_id: newInteraction.counselorId,
      student_id: newInteraction.studentId,
      contact_id: newInteraction.contactId,
      category_id: newInteraction.categoryId,
      subcategory_id: newInteraction.subcategoryId,
      custom_reason: newInteraction.customReason,
      start_time: newInteraction.startTime,
      duration_minutes: newInteraction.durationMinutes,
      end_time: newInteraction.endTime,
      notes: newInteraction.notes,
      needs_follow_up: newInteraction.needsFollowUp,
      follow_up_date: newInteraction.followUpDate,
      follow_up_notes: newInteraction.followUpNotes,
      is_follow_up_complete: newInteraction.isFollowUpComplete,
      created_at: newInteraction.createdAt,
      updated_at: newInteraction.updatedAt,
    };
    
    return HttpResponse.json(dbInteraction, { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/interactions`, async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const body = await request.json() as any;
    
    const index = mockData.interactions.findIndex(i => i.id === id);

    if (index !== -1) {
      // Update with snake_case to camelCase conversion
      mockData.interactions[index] = {
        ...mockData.interactions[index],
        studentId: body.student_id !== undefined ? body.student_id : mockData.interactions[index].studentId,
        contactId: body.contact_id !== undefined ? body.contact_id : mockData.interactions[index].contactId,
        categoryId: body.category_id !== undefined ? body.category_id : mockData.interactions[index].categoryId,
        subcategoryId: body.subcategory_id !== undefined ? body.subcategory_id : mockData.interactions[index].subcategoryId,
        customReason: body.custom_reason !== undefined ? body.custom_reason : mockData.interactions[index].customReason,
        startTime: body.start_time !== undefined ? body.start_time : mockData.interactions[index].startTime,
        durationMinutes: body.duration_minutes !== undefined ? body.duration_minutes : mockData.interactions[index].durationMinutes,
        endTime: body.end_time !== undefined ? body.end_time : mockData.interactions[index].endTime,
        notes: body.notes !== undefined ? body.notes : mockData.interactions[index].notes,
        needsFollowUp: body.needs_follow_up !== undefined ? body.needs_follow_up : mockData.interactions[index].needsFollowUp,
        followUpDate: body.follow_up_date !== undefined ? body.follow_up_date : mockData.interactions[index].followUpDate,
        followUpNotes: body.follow_up_notes !== undefined ? body.follow_up_notes : mockData.interactions[index].followUpNotes,
        updatedAt: new Date().toISOString(),
      };
      
      // Return in DB format
      const dbInteraction = {
        id: mockData.interactions[index].id,
        tenant_id: mockData.interactions[index].tenantId,
        counselor_id: mockData.interactions[index].counselorId,
        student_id: mockData.interactions[index].studentId,
        contact_id: mockData.interactions[index].contactId,
        category_id: mockData.interactions[index].categoryId,
        subcategory_id: mockData.interactions[index].subcategoryId,
        custom_reason: mockData.interactions[index].customReason,
        start_time: mockData.interactions[index].startTime,
        duration_minutes: mockData.interactions[index].durationMinutes,
        end_time: mockData.interactions[index].endTime,
        notes: mockData.interactions[index].notes,
        needs_follow_up: mockData.interactions[index].needsFollowUp,
        follow_up_date: mockData.interactions[index].followUpDate,
        follow_up_notes: mockData.interactions[index].followUpNotes,
        is_follow_up_complete: mockData.interactions[index].isFollowUpComplete,
        created_at: mockData.interactions[index].createdAt,
        updated_at: mockData.interactions[index].updatedAt,
      };
      
      return HttpResponse.json(dbInteraction);
    }

    return HttpResponse.json({ error: 'Interaction not found' }, { status: 404 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/interactions`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    
    const index = mockData.interactions.findIndex(i => i.id === id);

    if (index !== -1) {
      mockData.interactions.splice(index, 1);
      return HttpResponse.json({}, { status: 204 });
    }

    return HttpResponse.json({ error: 'Interaction not found' }, { status: 404 });
  }),

  // Reason categories endpoints
  http.get(`${SUPABASE_URL}/rest/v1/reason_categories`, () => {
    // Convert to DB format
    const categories = mockData.reasonCategories.map(c => ({
      id: c.id,
      tenant_id: c.tenantId,
      name: c.name,
      color: c.color,
      sort_order: c.sortOrder,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));

    return HttpResponse.json(categories);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/reason_categories`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newCategory = {
      id: body.id || crypto.randomUUID(),
      tenantId: body.tenant_id,
      name: body.name,
      color: body.color,
      sortOrder: body.sort_order,
      createdAt: body.created_at || new Date().toISOString(),
      updatedAt: body.updated_at || new Date().toISOString(),
    };

    mockData.reasonCategories.push(newCategory);
    
    const dbCategory = {
      id: newCategory.id,
      tenant_id: newCategory.tenantId,
      name: newCategory.name,
      color: newCategory.color,
      sort_order: newCategory.sortOrder,
      created_at: newCategory.createdAt,
      updated_at: newCategory.updatedAt,
    };
    
    return HttpResponse.json(dbCategory, { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/reason_categories`, async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const body = await request.json() as any;
    
    const index = mockData.reasonCategories.findIndex(c => c.id === id);

    if (index !== -1) {
      mockData.reasonCategories[index] = {
        ...mockData.reasonCategories[index],
        name: body.name !== undefined ? body.name : mockData.reasonCategories[index].name,
        color: body.color !== undefined ? body.color : mockData.reasonCategories[index].color,
        sortOrder: body.sort_order !== undefined ? body.sort_order : mockData.reasonCategories[index].sortOrder,
        updatedAt: new Date().toISOString(),
      };
      
      const dbCategory = {
        id: mockData.reasonCategories[index].id,
        tenant_id: mockData.reasonCategories[index].tenantId,
        name: mockData.reasonCategories[index].name,
        color: mockData.reasonCategories[index].color,
        sort_order: mockData.reasonCategories[index].sortOrder,
        created_at: mockData.reasonCategories[index].createdAt,
        updated_at: mockData.reasonCategories[index].updatedAt,
      };
      
      return HttpResponse.json(dbCategory);
    }

    return HttpResponse.json({ error: 'Category not found' }, { status: 404 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/reason_categories`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    
    const index = mockData.reasonCategories.findIndex(c => c.id === id);

    if (index !== -1) {
      mockData.reasonCategories.splice(index, 1);
      // Also delete subcategories
      mockData.reasonSubcategories = mockData.reasonSubcategories.filter(s => s.categoryId !== id);
      return HttpResponse.json({}, { status: 204 });
    }

    return HttpResponse.json({ error: 'Category not found' }, { status: 404 });
  }),

  // Reason subcategories endpoints
  http.get(`${SUPABASE_URL}/rest/v1/reason_subcategories`, ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');

    let subcategories = mockData.reasonSubcategories;
    
    if (categoryId) {
      subcategories = subcategories.filter(s => s.categoryId === categoryId);
    }

    // Convert to DB format
    const dbSubcategories = subcategories.map(s => ({
      id: s.id,
      category_id: s.categoryId,
      name: s.name,
      sort_order: s.sortOrder,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));

    return HttpResponse.json(dbSubcategories);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/reason_subcategories`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newSubcategory = {
      id: body.id || crypto.randomUUID(),
      categoryId: body.category_id,
      name: body.name,
      sortOrder: body.sort_order,
      createdAt: body.created_at || new Date().toISOString(),
      updatedAt: body.updated_at || new Date().toISOString(),
    };

    mockData.reasonSubcategories.push(newSubcategory);
    
    const dbSubcategory = {
      id: newSubcategory.id,
      category_id: newSubcategory.categoryId,
      name: newSubcategory.name,
      sort_order: newSubcategory.sortOrder,
      created_at: newSubcategory.createdAt,
      updated_at: newSubcategory.updatedAt,
    };
    
    return HttpResponse.json(dbSubcategory, { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/reason_subcategories`, async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const body = await request.json() as any;
    
    const index = mockData.reasonSubcategories.findIndex(s => s.id === id);

    if (index !== -1) {
      mockData.reasonSubcategories[index] = {
        ...mockData.reasonSubcategories[index],
        name: body.name !== undefined ? body.name : mockData.reasonSubcategories[index].name,
        sortOrder: body.sort_order !== undefined ? body.sort_order : mockData.reasonSubcategories[index].sortOrder,
        updatedAt: new Date().toISOString(),
      };
      
      const dbSubcategory = {
        id: mockData.reasonSubcategories[index].id,
        category_id: mockData.reasonSubcategories[index].categoryId,
        name: mockData.reasonSubcategories[index].name,
        sort_order: mockData.reasonSubcategories[index].sortOrder,
        created_at: mockData.reasonSubcategories[index].createdAt,
        updated_at: mockData.reasonSubcategories[index].updatedAt,
      };
      
      return HttpResponse.json(dbSubcategory);
    }

    return HttpResponse.json({ error: 'Subcategory not found' }, { status: 404 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/reason_subcategories`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    
    const index = mockData.reasonSubcategories.findIndex(s => s.id === id);

    if (index !== -1) {
      mockData.reasonSubcategories.splice(index, 1);
      return HttpResponse.json({}, { status: 204 });
    }

    return HttpResponse.json({ error: 'Subcategory not found' }, { status: 404 });
  }),

  // Users endpoints
  http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
    // Convert to DB format
    const users = mockData.users.map(u => ({
      id: u.id,
      tenant_id: u.tenantId,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      role: u.role,
      is_active: u.isActive,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
    }));

    return HttpResponse.json(users);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/users`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newUser = {
      id: body.id || crypto.randomUUID(),
      tenantId: body.tenant_id,
      email: body.email,
      firstName: body.first_name,
      lastName: body.last_name,
      role: body.role,
      isActive: body.is_active !== undefined ? body.is_active : true,
      createdAt: body.created_at || new Date().toISOString(),
      updatedAt: body.updated_at || new Date().toISOString(),
    };

    mockData.users.push(newUser);
    
    const dbUser = {
      id: newUser.id,
      tenant_id: newUser.tenantId,
      email: newUser.email,
      first_name: newUser.firstName,
      last_name: newUser.lastName,
      role: newUser.role,
      is_active: newUser.isActive,
      created_at: newUser.createdAt,
      updated_at: newUser.updatedAt,
    };
    
    return HttpResponse.json(dbUser, { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/users`, async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const body = await request.json() as any;
    
    const index = mockData.users.findIndex(u => u.id === id);

    if (index !== -1) {
      mockData.users[index] = {
        ...mockData.users[index],
        email: body.email !== undefined ? body.email : mockData.users[index].email,
        firstName: body.first_name !== undefined ? body.first_name : mockData.users[index].firstName,
        lastName: body.last_name !== undefined ? body.last_name : mockData.users[index].lastName,
        role: body.role !== undefined ? body.role : mockData.users[index].role,
        isActive: body.is_active !== undefined ? body.is_active : mockData.users[index].isActive,
        updatedAt: new Date().toISOString(),
      };
      
      const dbUser = {
        id: mockData.users[index].id,
        tenant_id: mockData.users[index].tenantId,
        email: mockData.users[index].email,
        first_name: mockData.users[index].firstName,
        last_name: mockData.users[index].lastName,
        role: mockData.users[index].role,
        is_active: mockData.users[index].isActive,
        created_at: mockData.users[index].createdAt,
        updated_at: mockData.users[index].updatedAt,
      };
      
      return HttpResponse.json(dbUser);
    }

    return HttpResponse.json({ error: 'User not found' }, { status: 404 });
  }),
];

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Helper function to sanitize table name (prevent SQL injection)
function sanitizeTableName(topic: string): string {
  // Convert topic to valid table name (lowercase, replace spaces with hyphens)
  return topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.question || !data.topic) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question text and topic are required' 
      }, { status: 400 });
    }

    const tableName = sanitizeTableName(data.topic);

    // Insert into the specific topic table using raw SQL
    const result = await db.execute(sql.raw(`
      INSERT INTO "${tableName}" (
        question, 
        topic,
        category,
        option_a, 
        option_b, 
        option_c, 
        option_d, 
        answer,
        explanation
      ) VALUES (
        '${data.question.replace(/'/g, "''")}',
        '${data.topic.replace(/'/g, "''")}',
        ${data.category ? `'${data.category.replace(/'/g, "''")}'` : 'NULL'},
        '${(data.option_a || '').replace(/'/g, "''")}',
        '${(data.option_b || '').replace(/'/g, "''")}',
        '${(data.option_c || '').replace(/'/g, "''")}',
        '${(data.option_d || '').replace(/'/g, "''")}',
        ${data.answer ? `'${data.answer.replace(/'/g, "''")}'` : 'NULL'},
        '${(data.explanation || '').replace(/'/g, "''")}'
      ) RETURNING *
    `));

    return NextResponse.json({ 
      success: true, 
      question: Array.isArray(result) ? result[0] : result 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating question:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || 'Failed to create question. Make sure the table exists.' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { s_no, topic, ...updateData } = data;
    
    if (!s_no || !topic) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing question s_no or topic' 
      }, { status: 400 });
    }

    const tableName = sanitizeTableName(topic);
    const sNoNum = Number(s_no);

    // Build update query dynamically
    const updateFields: string[] = [];

    if (updateData.question !== undefined) {
      updateFields.push(`question = '${updateData.question.replace(/'/g, "''")}'`);
    }
    if (updateData.category !== undefined) {
      updateFields.push(updateData.category ? `category = '${updateData.category.replace(/'/g, "''")}'` : 'category = NULL');
    }
    if (updateData.option_a !== undefined) {
      updateFields.push(`option_a = '${updateData.option_a.replace(/'/g, "''")}'`);
    }
    if (updateData.option_b !== undefined) {
      updateFields.push(`option_b = '${updateData.option_b.replace(/'/g, "''")}'`);
    }
    if (updateData.option_c !== undefined) {
      updateFields.push(`option_c = '${updateData.option_c.replace(/'/g, "''")}'`);
    }
    if (updateData.option_d !== undefined) {
      updateFields.push(`option_d = '${updateData.option_d.replace(/'/g, "''")}'`);
    }
    if (updateData.answer !== undefined) {
      updateFields.push(updateData.answer ? `answer = '${updateData.answer.replace(/'/g, "''")}'` : 'answer = NULL');
    }
    if (updateData.explanation !== undefined) {
      updateFields.push(`explanation = '${updateData.explanation.replace(/'/g, "''")}'`);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No fields to update' 
      }, { status: 400 });
    }

    const result = await db.execute(sql.raw(`
      UPDATE "${tableName}"
      SET ${updateFields.join(', ')}
      WHERE s_no = ${sNoNum}
      RETURNING *
    `));

    const updated = Array.isArray(result) ? result : [result];
    
    if (!updated || updated.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found or not updated' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      question: updated[0] 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating question:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || 'Internal server error' 
    }, { status: 500 });
  }
}
    
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s_no = searchParams.get('s_no');
    const topic = searchParams.get('topic');
    
    if (!s_no || !topic) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing question s_no or topic' 
      }, { status: 400 });
    }

    const tableName = sanitizeTableName(topic);
    const sNoNum = Number(s_no);

    const result = await db.execute(sql.raw(`
      DELETE FROM "${tableName}"
      WHERE s_no = ${sNoNum}
      RETURNING *
    `));

    const deleted = Array.isArray(result) ? result : [result];
    
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Question deleted successfully' 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error deleting question:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || 'Internal server error' 
    }, { status: 500 });
  }
}

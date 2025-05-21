import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { requestFigma } from "./libs/openapi";
import { vValidator } from "@hono/valibot-validator";
import { object, string } from "valibot";
import { components } from "./__generated__/schema";

// Figma API のノード型（必要に応じて他のフィールドも追加）
interface FigmaNode {
  id: string;                    // 一意識別子
  name: string;                  // レイヤー名
  type: string;                  // DOCUMENT, PAGE, FRAME, SECTION, TEXT, …
  visible?: boolean;             // 表示フラグ
  //pluginData?: Record<string, any>;
  sharedPluginData?: Record<string, any>;
  children?: FigmaNode[];
  // レイアウト情報 (Auto Layout)
  layoutMode?: 'HORIZONTAL'|'VERTICAL'|'NONE';
  primaryAxisSizingMode?: 'FIXED'|'AUTO';
  counterAxisSizingMode?: 'FIXED'|'AUTO';
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  // ビジュアル属性
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  effects?: any[];
  blendMode?: string;
  opacity?: number;
  // テキスト情報
  characters?: string;
  style?: any;
  lineHeightPercent?: number;
  letterSpacing?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  // セマンティック情報
  componentId?: string;
  componentProperties?: Record<string, any>;
  isMask?: boolean;
  layoutGrids?: any[];
  // バウンディングボックス
  absoluteBoundingBox?: {
    x: number; y: number; width: number; height: number;
  };
}

interface SummarizedNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  children?: SummarizedNode[];
  meta: {
    pluginData?: Record<string, any>;
    sharedPluginData?: Record<string, any>;
    layout?: Partial<Pick<FigmaNode,
      'layoutMode'|'primaryAxisSizingMode'|'counterAxisSizingMode'|
      'primaryAxisAlignItems'|'counterAxisAlignItems'|
      'itemSpacing'|'paddingLeft'|'paddingRight'|'paddingTop'|'paddingBottom'
    >>;
    style?: Partial<Pick<FigmaNode,
      'fills'|'strokes'|'strokeWeight'|'strokeAlign'|
      'cornerRadius'|'effects'|'blendMode'|'opacity'
    >>;
    text?: Partial<Pick<FigmaNode,
      'characters'|'style'|'lineHeightPercent'|
      'letterSpacing'|'textAlignHorizontal'|'textAlignVertical'
    >>;
    semantic?: Partial<Pick<FigmaNode,
      'componentId'|'componentProperties'|'isMask'|'layoutGrids'
    >>;
    boundingBox?: FigmaNode['absoluteBoundingBox'];
    component?: Record<string, any>;
  };
}

const summarizeF = (nodes: components['schemas']['Node'][]) => {
  const walk = (nodes: components['schemas']['Node'][], depth: number): SummarizedNode[] => {
    return nodes.flatMap(node => {
      switch (node.type) {
        case 'FRAME':
        case 'COMPONENT':
        case 'COMPONENT_SET':
        case 'TEXT':
        case 'RECTANGLE':
        case 'LINE':
        case 'ELLIPSE':
        case 'REGULAR_POLYGON':
        case 'STAR':
        case 'VECTOR': {
          const params: SummarizedNode = {
            id: node.id,
            name: node.name,
            type: node.type,
            visible: node.visible ?? true,
            meta: {
              layout: {
                layoutMode: node.layoutMode,
                primaryAxisSizingMode: node.primaryAxisSizingMode,
                counterAxisSizingMode: node.counterAxisSizingMode,
                primaryAxisAlignItems: node.primaryAxisAlignItems,
                counterAxisAlignItems: node.counterAxisAlignItems,
                itemSpacing: node.itemSpacing,
                paddingLeft: node.paddingLeft,
                paddingRight: node.paddingRight,
                paddingTop: node.paddingTop,
                paddingBottom: node.paddingBottom,
              },
              style: {
                fills: node.fills,
                strokes: node.strokes,
                strokeWeight: node.strokeWeight,
                strokeAlign: node.strokeAlign,
                cornerRadius: node.cornerRadius,
                effects: node.effects,
                blendMode: node.blendMode,
                opacity: node.opacity,
              },
              text: {
                characters: node.characters,
                style: node.style,
                lineHeightPercent: node.lineHeightPercent,
                letterSpacing: node.letterSpacing,
                textAlignHorizontal: node.textAlignHorizontal,
                textAlignVertical: node.textAlignVertical,
              },
              semantic: {
                componentId: node.componentId,
                componentProperties: node.componentProperties,
                isMask: node.isMask,
                layoutGrids: node.layoutGrids,
              },
              component: {
                references: node.componentReferences,
                name: node.componentName,
                description: node.componentDescription,
                thumbnailUrl: node.componentThumbnailUrl,
              }
            }
          }

          if (node.children) {
            params.children = walk(node.children, depth + 1);
          }

          return params;
        }
        case 'BOOLEAN_OPERATION':
        case 'CANVAS':
        case 'DOCUMENT':
        case 'GROUP':
        case 'INSTANCE':
        case 'SECTION':
        case 'TABLE':
        case 'WIDGET':{
          return walk(node.children, depth + 1);
        }
        case 'CONNECTOR':
        case 'EMBED':
        case 'LINK_UNFURL':
        case 'SHAPE_WITH_TEXT':
        case 'SLICE':
        case 'STICKY':
        case 'TABLE_CELL':
        case 'WASHI_TAPE': {
          return []
        }
      }
    })
  }
  

  const result = walk(nodes, 0)
  return result
}

const app = new Hono();
const port = 8787;

app.get('/', (c) => {
  return c.text('Hello World');
}).get('/figma', vValidator('query', object({
  page: string(),
  frame: string()
})), async (c) => {
  const { page, frame } = c.req.valid('query')
  const response = await requestFigma('/v1/files/{file_key}', 'get', {
    path: {
      file_key: 'yOrwXkWskKh05Mu2LOKl0V'
    },
    query: {}
  })
  const json = await response.json()
  const frameContent = json.document.children
    .find(c => c.name === page)?.children
    .filter(c => c.name === frame)
    .filter(c => c.type === 'FRAME')
  
  const dd = summarizeF(frameContent?.[0]?.children ?? [])
  
  return c.json(dd, 200)
}).get('/figma/components', async (c) => {
  const response = await requestFigma('/v1/files/{file_key}/components', 'get', {
    path: {
      file_key: 'Q2Y2t9I3Vyjd4kOI8CnvOn'
    }
  })
  const json = await response.json()
  return c.json(json, 200)
});

serve({
  fetch: app.fetch,
  port,
})

console.log(`💨 Server is running on http://localhost:${port}`);

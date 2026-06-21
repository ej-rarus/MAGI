import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, PointerEvent } from 'react'
import { requestMagiJudgement } from '../lib/magiClient'
import {
  NODE_PROFILES,
  NODE_SEQUENCE,
  hashQuestion,
  verdictClass,
  type MagiJudgementResponse,
  type MagiNode,
} from '../lib/magiJudgement'
import '../styles/magi.css'

type DemoStatus = 'idle' | 'reviewing' | 'complete'

const NODE_CLASS: Record<MagiNode, string> = {
  melchior: 'magi-node--melchior',
  balthasar: 'magi-node--balthasar',
  casper: 'magi-node--casper',
}

function Magi() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<DemoStatus>('idle')
  const [activeNode, setActiveNode] = useState<MagiNode | null>(null)
  const [verdicts, setVerdicts] = useState<Partial<Record<MagiNode, MagiJudgementResponse['finalVerdict']>>>({})
  const [judgement, setJudgement] = useState<MagiJudgementResponse | null>(null)
  const [selectedNode, setSelectedNode] = useState<MagiNode | null>(null)
  const [decisionCode, setDecisionCode] = useState(263)
  const timersRef = useRef<number[]>([])
  const insightCloseTimerRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)

  const finalVerdict = status === 'complete' && judgement ? judgement.finalVerdict : '保留'
  const reviewLabel = status === 'idle' ? '待機中' : status === 'reviewing' ? '審議中' : finalVerdict
  const exMode = status === 'reviewing' ? 'ON' : 'OFF'
  const priority = status === 'complete' ? finalVerdict : 'AAA'
  const formattedDecisionCode = decisionCode.toString().padStart(3, '0')
  const selectedInsight = selectedNode && status === 'complete' ? judgement?.judges[selectedNode] : null
  const selectedProfile = selectedNode ? NODE_PROFILES[selectedNode] : null

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      timersRef.current.forEach(window.clearTimeout)
      if (insightCloseTimerRef.current !== null) {
        window.clearTimeout(insightCloseTimerRef.current)
      }
    }
  }, [])

  const clearInsightCloseTimer = () => {
    if (insightCloseTimerRef.current !== null) {
      window.clearTimeout(insightCloseTimerRef.current)
      insightCloseTimerRef.current = null
    }
  }

  const scheduleNodeInsightClose = () => {
    clearInsightCloseTimer()
    insightCloseTimerRef.current = window.setTimeout(() => {
      setSelectedNode(null)
      insightCloseTimerRef.current = null
    }, 160)
  }

  const clearTimers = () => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    clearInsightCloseTimer()
  }

  const scheduleJudgementReveal = (nextJudgement: MagiJudgementResponse) => {
    NODE_SEQUENCE.forEach((node, index) => {
      const activateTimer = window.setTimeout(() => {
        setActiveNode(node)
      }, 260 + index * 760)

      const verdictTimer = window.setTimeout(() => {
        setVerdicts((currentVerdicts) => ({
          ...currentVerdicts,
          [node]: nextJudgement.judges[node].verdict,
        }))
      }, 780 + index * 760)

      timersRef.current.push(activateTimer, verdictTimer)
    })

    const completeTimer = window.setTimeout(() => {
      setActiveNode(null)
      setStatus('complete')
    }, 2780)

    timersRef.current.push(completeTimer)
  }

  const runJudgement = async (normalizedQuestion: string, requestId: number) => {
    const nextJudgement = await requestMagiJudgement(normalizedQuestion)

    if (requestIdRef.current !== requestId) {
      return
    }

    setJudgement(nextJudgement)
    setDecisionCode(nextJudgement.code)
    scheduleJudgementReveal(nextJudgement)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedQuestion = question.trim()
    if (!normalizedQuestion || status === 'reviewing') {
      return
    }

    clearTimers()

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setQuestion('')
    setStatus('reviewing')
    setActiveNode(null)
    setVerdicts({})
    setJudgement(null)
    setSelectedNode(null)
    setDecisionCode(hashQuestion(normalizedQuestion))
    void runJudgement(normalizedQuestion, requestId)
  }

  const getNodeState = (node: MagiNode) => {
    if (activeNode === node) {
      return 'active'
    }

    const verdict = verdicts[node]
    return verdict ? verdictClass[verdict] : 'waiting'
  }

  const revealNodeInsight = (node: MagiNode) => {
    if (status === 'complete') {
      clearInsightCloseTimer()
      setSelectedNode(node)
    }
  }

  const handleNodeClick = (node: MagiNode) => {
    if (status === 'complete') {
      clearInsightCloseTimer()
      setSelectedNode(node)
    }
  }

  const handleNodeKeyDown = (event: KeyboardEvent<HTMLElement>, node: MagiNode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNodeClick(node)
    }
  }

  const handleShellPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (status !== 'complete') {
      return
    }

    const target = event.target
    if (target instanceof Element && target.closest('.magi-node, .node-insight')) {
      clearInsightCloseTimer()
      return
    }

    clearInsightCloseTimer()
    setSelectedNode(null)
  }

  return (
    <main className="magi-shell" aria-label="MAGI System console" onPointerDown={handleShellPointerDown}>
        <section className="magi-console">
            <div className="magi-frame magi-frame--outer" />
            <div className="magi-frame magi-frame--inner" />

            <div className="magi-stage">
                <aside className="status-panel status-panel--left" aria-label="Filing status">
                    <div className="status-bars" />
                    <div className="status-kanji" aria-hidden="true">
                        <span>提</span>
                        <span>訴</span>
                    </div>
                    <div className="status-bars status-bars--lower" />
                    <div className="status-code">CODE:{formattedDecisionCode}</div>
                    <dl className="status-meta">
                        <div>
                            <dt>FILE</dt>
                            <dd>MAGI_SYS</dd>
                        </div>
                        <div>
                            <dt>EXTENTION</dt>
                            <dd>2025</dd>
                        </div>
                        <div>
                            <dt>EX_MODE</dt>
                            <dd>{exMode}</dd>
                        </div>
                        <div>
                            <dt>PRIORITY</dt>
                            <dd>{priority}</dd>
                        </div>
                    </dl>
                </aside>

                <aside className="status-panel status-panel--right" aria-label="Resolution status">
                    <div className="status-bars" />
                    <div className="status-kanji" aria-hidden="true">
                        <span>決</span>
                        <span>議</span>
                    </div>
                    <div className="status-bars status-bars--lower" />
                    <div className="review-badge" data-status={status} data-verdict={status === 'complete' ? verdictClass[finalVerdict] : 'pending'}>
                        {reviewLabel}
                    </div>
                </aside>

                <div className="magi-core" aria-label="MAGI computer network">
                    <div className="magi-link magi-link--left" data-active={status === 'reviewing'} />
                    <div className="magi-link magi-link--right" data-active={status === 'reviewing'} />
                    <div className="magi-link magi-link--bottom" data-active={status === 'reviewing'} />

                    {NODE_SEQUENCE.map((node) => (
                        <article
                            className={`magi-node ${NODE_CLASS[node]}`}
                            data-state={getNodeState(node)}
                            key={node}
                            role="button"
                            tabIndex={status === 'complete' ? 0 : -1}
                            aria-label={`${NODE_PROFILES[node].label} ${NODE_PROFILES[node].displayProvider}`}
                            onMouseEnter={() => revealNodeInsight(node)}
                            onMouseLeave={scheduleNodeInsightClose}
                            onPointerDown={(event) => {
                                if (event.pointerType !== 'mouse') {
                                    revealNodeInsight(node)
                                }
                            }}
                            onPointerUp={(event) => {
                                if (event.pointerType !== 'mouse') {
                                    revealNodeInsight(node)
                                }
                            }}
                            onTouchStart={() => revealNodeInsight(node)}
                            onTouchEnd={() => revealNodeInsight(node)}
                            onFocus={() => revealNodeInsight(node)}
                            onBlur={() => setSelectedNode(null)}
                            onClick={() => handleNodeClick(node)}
                            onKeyDown={(event) => handleNodeKeyDown(event, node)}
                        >
                            <span>{NODE_PROFILES[node].label}</span>
                        </article>
                    ))}
                    <div className="magi-name">MAGI</div>
                </div>

                {selectedInsight && selectedProfile ? (
                    <aside
                        className="node-insight"
                        data-node={selectedInsight.node}
                        data-verdict={verdictClass[selectedInsight.verdict]}
                        role="dialog"
                        aria-label={`${selectedProfile.displayProvider} judgement`}
                        onMouseEnter={clearInsightCloseTimer}
                        onMouseLeave={scheduleNodeInsightClose}
                    >
                        <div className="node-insight__head">
                            <span>{selectedProfile.displayProvider}</span>
                            <b>{selectedInsight.verdict}</b>
                        </div>
                        <strong>{selectedProfile.role}</strong>
                        <p>{selectedInsight.summary}</p>
                        <dl>
                            <div>
                                <dt>REASON</dt>
                                <dd>{selectedInsight.reason}</dd>
                            </div>
                            <div>
                                <dt>CONCERN</dt>
                                <dd>{selectedInsight.concern}</dd>
                            </div>
                        </dl>
                        <small>{selectedInsight.model} / {selectedInsight.source === 'api' ? 'API LINK' : 'INTERNAL LINK'}</small>
                    </aside>
                ) : null}
            </div>

            <form className="question-panel" aria-label="MAGI question input" autoComplete="off" onSubmit={handleSubmit}>
                <label htmlFor="magi-question">QUESTION:</label>
                <input
                    id="magi-question"
                    type="text"
                    aria-label="Question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={status === 'reviewing'}
                    autoComplete="off"
                    autoCorrect="off"
                    placeholder={status === 'reviewing' ? 'MAGI_SYS: 審議中' : 'INPUT QUESTION'}
                    spellCheck="false"
                />
                <button type="submit" disabled={status === 'reviewing'}>確認</button>
            </form>
        </section>
    </main>
  );
}

export default Magi;

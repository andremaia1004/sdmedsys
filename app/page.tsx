import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Clock, Users, FileText, MonitorSmartphone } from 'lucide-react';
import styles from './page.module.css';

const benefits = [
  {
    icon: <Clock size={32} />,
    title: 'Atendimento Rápido e Eficiente',
    description: 'Gestão de agendamentos integrada e fila inteligente que reduz o tempo de espera.'
  },
  {
    icon: <ShieldCheck size={32} />,
    title: 'Prontuário Seguro',
    description: 'Registros médicos organizados com validade jurídica, imutáveis após finalização.'
  },
  {
    icon: <Users size={32} />,
    title: 'Gestão Isolada e Segura',
    description: 'Acessos específicos para médicos, secretárias e gestão com proteção total dos dados (RLS).'
  },
  {
    icon: <FileText size={32} />,
    title: 'Emissão de Documentos',
    description: 'Geração automática de receitas, atestados e laudos em PDF, prontos para impressão.'
  },
  {
    icon: <MonitorSmartphone size={32} />,
    title: 'Display TV em Tempo Real',
    description: 'Painel para a sala de espera integrado com a fila, garantindo um fluxo organizado.'
  }
];

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.hero}>
        <div className={styles.logoContainer}>
          <Image
            src="/logo-clinica.png"
            alt="Logo da Clínica"
            width={120}
            height={120}
            className={styles.logo}
            priority
          />
        </div>

        <h1 className={styles.title}>
          SDMED<span className={styles.titleAccent}>SYS</span>
        </h1>

        <p className={styles.subtitle}>
          A próxima geração em gestão médica. Eficiente, seguro e moderno. Desenvolvido para clínicas que buscam excelência no atendimento.
        </p>

        <div className={styles.ctaWrapper}>
          <Link href="/login" className={styles.ctaButton}>
            Acessar Sistema
          </Link>
        </div>
      </main>

      <section className={styles.benefitsSection}>
        <div className={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={styles.benefitCard}
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
            >
              <div className={styles.iconWrapper}>
                {benefit.icon}
              </div>
              <h3 className={styles.benefitTitle}>{benefit.title}</h3>
              <p className={styles.benefitDesc}>{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} SDMED SYS. Todos os direitos reservados.
      </footer>
    </div>
  );
}

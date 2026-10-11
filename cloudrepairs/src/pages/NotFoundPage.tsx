import { Button } from '../components/ui/Button';
import { PageHero } from '../components/ui/PageHero';

export function NotFoundPage() {
  return (
    <>
      <PageHero title="Страница не найдена" lead="Возможно, адрес набран с ошибкой или страница была перемещена.">
        <div style={{ marginTop: 32 }}>
          <Button to="/" variant="inverse" size="l" icon="arrow-right">
            На главную
          </Button>
        </div>
      </PageHero>
      <div style={{ height: 'clamp(48px, 8vw, 120px)' }} />
    </>
  );
}
